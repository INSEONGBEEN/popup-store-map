package com.inseongbeen.popupstoremap.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@SpringBootTest(properties = {
        "spring.flyway.enabled=true",
        "spring.flyway.baseline-on-migrate=false",
        "spring.jpa.hibernate.ddl-auto=validate"
})
class FlywayMigrationIntegrationTests {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(
            DockerImageName.parse("postgis/postgis:17-3.6-alpine")
                    .asCompatibleSubstituteFor("postgres")
    );

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void appliesAllMigrationsAndCreatesIntegrityConstraints() {
        List<String> appliedVersions = jdbcTemplate.queryForList(
                "select version from flyway_schema_history where success order by installed_rank",
                String.class
        );
        String descriptionType = jdbcTemplate.queryForObject(
                """
                select data_type
                  from information_schema.columns
                 where table_schema = 'public'
                   and table_name = 'popup_store'
                   and column_name = 'description'
                """,
                String.class
        );
        Integer integrityConstraintCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                  from pg_constraint
                 where conname in (
                     'fk_engagement_summary_popup',
                     'fk_engagement_event_popup',
                     'fk_popup_like_popup',
                     'fk_review_summary_popup',
                     'ck_review_rating',
                     'ck_review_content_length',
                     'fk_refresh_token_replacement'
                 )
                """,
                Integer.class
        );

        assertThat(appliedVersions).containsExactly("1", "2");
        assertThat(descriptionType).isEqualTo("text");
        assertThat(integrityConstraintCount).isEqualTo(7);
    }

    @Test
    void databaseRejectsInvalidPopupStoreCoordinatesAndDates() {
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                insert into popup_store (
                    name, address, latitude, longitude, start_date, end_date, created_at, updated_at
                ) values (?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
                """,
                "무효 좌표", "서울", 137.0, 127.0,
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31)
        )).hasMessageContaining("ck_popup_store_latitude");

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                insert into popup_store (
                    name, address, latitude, longitude, start_date, end_date, created_at, updated_at
                ) values (?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
                """,
                "무효 날짜", "서울", 37.0, 127.0,
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 7, 1)
        )).hasMessageContaining("ck_popup_store_dates");
    }
}
