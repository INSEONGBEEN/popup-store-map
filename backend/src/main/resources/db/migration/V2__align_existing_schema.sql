DO $$
DECLARE
    description_data_type text;
BEGIN
    SELECT data_type
      INTO description_data_type
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'popup_store'
       AND column_name = 'description';

    IF description_data_type = 'oid' THEN
        ALTER TABLE popup_store
            ALTER COLUMN description TYPE text
            USING CASE
                WHEN description IS NULL THEN NULL
                ELSE convert_from(lo_get(description), 'UTF8')
            END;
    END IF;
END $$;

ALTER TABLE popup_store ALTER COLUMN name SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_popup_store_dates') THEN
        ALTER TABLE popup_store ADD CONSTRAINT ck_popup_store_dates CHECK (start_date <= end_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_popup_store_latitude') THEN
        ALTER TABLE popup_store ADD CONSTRAINT ck_popup_store_latitude CHECK (latitude BETWEEN -90 AND 90);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_popup_store_longitude') THEN
        ALTER TABLE popup_store ADD CONSTRAINT ck_popup_store_longitude CHECK (longitude BETWEEN -180 AND 180);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_engagement_summary_popup') THEN
        ALTER TABLE popup_engagement_summary
            ADD CONSTRAINT fk_engagement_summary_popup
            FOREIGN KEY (popup_store_id) REFERENCES popup_store(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_engagement_summary_nonnegative') THEN
        ALTER TABLE popup_engagement_summary
            ADD CONSTRAINT ck_engagement_summary_nonnegative
            CHECK (view_count >= 0 AND like_count >= 0 AND plan_add_count >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_engagement_event_popup') THEN
        ALTER TABLE popup_engagement_event
            ADD CONSTRAINT fk_engagement_event_popup
            FOREIGN KEY (popup_store_id) REFERENCES popup_store(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_popup_like_popup') THEN
        ALTER TABLE popup_like
            ADD CONSTRAINT fk_popup_like_popup
            FOREIGN KEY (popup_store_id) REFERENCES popup_store(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_review_summary_popup') THEN
        ALTER TABLE popup_review_summary
            ADD CONSTRAINT fk_review_summary_popup
            FOREIGN KEY (popup_store_id) REFERENCES popup_store(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_review_summary_nonnegative') THEN
        ALTER TABLE popup_review_summary
            ADD CONSTRAINT ck_review_summary_nonnegative
            CHECK (rating_sum >= 0 AND review_count >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_review_summary_average') THEN
        ALTER TABLE popup_review_summary
            ADD CONSTRAINT ck_review_summary_average CHECK (average_rating BETWEEN 0 AND 5);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_review_rating') THEN
        ALTER TABLE popup_review ADD CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_review_content_length') THEN
        ALTER TABLE popup_review
            ADD CONSTRAINT ck_review_content_length CHECK (char_length(content) BETWEEN 10 AND 1000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_refresh_token_replacement') THEN
        UPDATE refresh_token replacement
           SET replaced_by_token_id = NULL
         WHERE replaced_by_token_id IS NOT NULL
           AND NOT EXISTS (
               SELECT 1 FROM refresh_token target WHERE target.id = replacement.replaced_by_token_id
           );
        ALTER TABLE refresh_token
            ADD CONSTRAINT fk_refresh_token_replacement
            FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_token(id) ON DELETE SET NULL;
    END IF;
END $$;
