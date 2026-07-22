package com.neetaspirants.api.dto;

import java.time.Instant;

public class NotificationDtos {

    public record NotificationDto(
            Long id, String type, String actorAlias, String message,
            String postSlug, String subforumSlug, boolean read, Instant createdAt
    ) {}

    public record UnreadCountDto(long count) {}
}
