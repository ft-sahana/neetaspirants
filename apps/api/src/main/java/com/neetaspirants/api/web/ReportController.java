package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ReportDtos.CreateReportRequest;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/posts/{id}/report")
    @ResponseStatus(HttpStatus.CREATED)
    public void reportPost(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateReportRequest request
    ) {
        reportService.reportPost(id, principal.profileId(), request);
    }

    @PostMapping("/comments/{id}/report")
    @ResponseStatus(HttpStatus.CREATED)
    public void reportComment(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateReportRequest request
    ) {
        reportService.reportComment(id, principal.profileId(), request);
    }
}
