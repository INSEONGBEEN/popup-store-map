package com.inseongbeen.popupstoremap.popupstore.controller;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreRequestDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.service.PopupStoreService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Popup Store", description = "팝업스토어 CRUD API")
@RestController
@RequestMapping("/api/popup-stores")
@RequiredArgsConstructor
public class PopupStoreController {

    private final PopupStoreService popupStoreService;

    @Operation(summary = "팝업스토어 등록", description = "새로운 팝업스토어 정보를 등록합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "등록 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패")
    })
    @PostMapping
    public ResponseEntity<PopupStoreResponseDto> create(
            @Valid @RequestBody PopupStoreRequestDto request
    ) {
        PopupStoreResponseDto response = popupStoreService.create(request);
        return ResponseEntity.created(URI.create("/api/popup-stores/" + response.id()))
                .body(response);
    }

    @Operation(summary = "팝업스토어 전체 조회", description = "등록된 모든 팝업스토어를 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping
    public ResponseEntity<List<PopupStoreResponseDto>> findAll(
            @RequestHeader(value = "X-Anonymous-Visitor-Id", required = false) String anonymousVisitorId
    ) {
        return ResponseEntity.ok(popupStoreService.findAll(anonymousVisitorId));
    }

    @Operation(
            summary = "주목할 팝업스토어 조회",
            description = "최근 30일 조회·좋아요·일정 추가 지표를 보정한 순서로 운영 중/예정 팝업을 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "limit 형식 오류")
    })
    @GetMapping("/featured")
    public ResponseEntity<List<PopupStoreResponseDto>> featured(
            @RequestParam(defaultValue = "4") int limit,
            @RequestHeader(value = "X-Anonymous-Visitor-Id", required = false) String anonymousVisitorId
    ) {
        return ResponseEntity.ok(popupStoreService.findFeatured(limit, anonymousVisitorId));
    }

    @Operation(
            summary = "팝업스토어 검색",
            description = "이름, 카테고리, 운영 상태, 운영일 조건을 AND로 조합해 페이징 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "검색 성공"),
            @ApiResponse(responseCode = "400", description = "검색 조건 또는 정렬값 오류")
    })
    @GetMapping("/search")
    public ResponseEntity<PageResponseDto<PopupStoreResponseDto>> search(
            @Parameter(description = "이름 검색어(대소문자 무시)", example = "성수")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "카테고리", example = "FASHION")
            @RequestParam(required = false) PopupStoreCategory category,
            @Parameter(description = "운영 상태", example = "OPEN")
            @RequestParam(required = false) PopupStoreStatus status,
            @Parameter(description = "해당 날짜에 운영 중인 팝업스토어 검색", example = "2026-07-21")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate operatingDate,
            @ParameterObject
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable,
            @RequestHeader(value = "X-Anonymous-Visitor-Id", required = false) String anonymousVisitorId
    ) {
        return ResponseEntity.ok(
                popupStoreService.search(keyword, category, status, operatingDate, pageable, anonymousVisitorId)
        );
    }

    @Operation(summary = "팝업스토어 단건 조회", description = "ID에 해당하는 팝업스토어를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "팝업스토어를 찾을 수 없음")
    })
    @GetMapping("/{id}")
    public ResponseEntity<PopupStoreResponseDto> findById(
            @Parameter(description = "팝업스토어 ID", example = "1") @PathVariable Long id
    ) {
        return ResponseEntity.ok(popupStoreService.findById(id));
    }

    @Operation(summary = "팝업스토어 수정", description = "ID에 해당하는 팝업스토어 정보를 수정합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "404", description = "팝업스토어를 찾을 수 없음")
    })
    @PutMapping("/{id}")
    public ResponseEntity<PopupStoreResponseDto> update(
            @Parameter(description = "팝업스토어 ID", example = "1") @PathVariable Long id,
            @Valid @RequestBody PopupStoreRequestDto request
    ) {
        return ResponseEntity.ok(popupStoreService.update(id, request));
    }

    @Operation(summary = "팝업스토어 삭제", description = "ID에 해당하는 팝업스토어를 삭제합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "404", description = "팝업스토어를 찾을 수 없음")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "팝업스토어 ID", example = "1") @PathVariable Long id
    ) {
        popupStoreService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
