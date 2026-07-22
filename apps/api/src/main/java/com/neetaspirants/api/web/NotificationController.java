package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.NotificationDtos.NotificationDto;
import com.neetaspirants.api.dto.NotificationDtos.UnreadCountDto;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDto> list(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return notificationService.listForProfile(principal.profileId());
    }

    @GetMapping("/unread-count")
    public UnreadCountDto unreadCount(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return new UnreadCountDto(notificationService.unreadCount(principal.profileId()));
    }

    @PostMapping("/mark-all-read")
    public void markAllRead(@AuthenticationPrincipal AuthenticatedProfile principal) {
        notificationService.markAllRead(principal.profileId());
    }
}
