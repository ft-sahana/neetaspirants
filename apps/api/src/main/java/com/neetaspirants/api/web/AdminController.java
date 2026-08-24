package com.neetaspirants.api.web;

import com.neetaspirants.api.domain.ReportStatus;
import com.neetaspirants.api.dto.AdminDtos.AdminReportDto;
import com.neetaspirants.api.dto.AdminDtos.AdminUserDto;
import com.neetaspirants.api.dto.AdminDtos.SuspendRequest;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.AdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/reports")
    public Page<AdminReportDto> listReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return adminService.listReports(status, PageRequest.of(page, size));
    }

    @PostMapping("/reports/{id}/dismiss")
    public void dismissReport(@AuthenticationPrincipal AuthenticatedProfile principal, @PathVariable Long id) {
        adminService.dismissReport(id, principal.userId());
    }

    @DeleteMapping("/reports/{id}/content")
    public void removeReportedContent(@AuthenticationPrincipal AuthenticatedProfile principal, @PathVariable Long id) {
        adminService.removeReportedContent(id, principal.userId());
    }

    @GetMapping("/users")
    public Page<AdminUserDto> listUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return adminService.listUsers(query, PageRequest.of(page, size));
    }

    @PostMapping("/users/{profileId}/suspend")
    public void suspendUser(@PathVariable Long profileId, @RequestBody(required = false) SuspendRequest request) {
        adminService.suspendUser(profileId, request != null ? request.reason() : null);
    }

    @PostMapping("/users/{profileId}/unsuspend")
    public void unsuspendUser(@PathVariable Long profileId) {
        adminService.unsuspendUser(profileId);
    }
}
