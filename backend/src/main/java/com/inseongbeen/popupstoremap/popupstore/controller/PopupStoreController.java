package com.inseongbeen.popupstoremap.popupstore.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreRequestDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.popupstore.service.PopupStoreService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/popup-stores")
@RequiredArgsConstructor
public class PopupStoreController {

    private final PopupStoreService popupStoreService;

    @PostMapping
    public ResponseEntity<PopupStoreResponseDto> create(
            @Valid @RequestBody PopupStoreRequestDto request
    ) {
        PopupStoreResponseDto response = popupStoreService.create(request);
        return ResponseEntity.created(URI.create("/api/popup-stores/" + response.id()))
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<PopupStoreResponseDto>> findAll() {
        return ResponseEntity.ok(popupStoreService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PopupStoreResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(popupStoreService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PopupStoreResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody PopupStoreRequestDto request
    ) {
        return ResponseEntity.ok(popupStoreService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        popupStoreService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
