package com.neetaspirants.api.dto;

import jakarta.validation.constraints.Size;

import java.time.Instant;

public class AdminDtos {

    public record SuspendRequest(@Size(max = 500) String reason) {}

    public record AdminReportDto(
            Long id,
            String targetType,
            Long targetId,
            String source,
            String reasonCode,
            String detail,
            String status,
            Instant createdAt,
            String reporterAlias,
            String targetExcerpt,
            String targetAuthorAlias,
            Long targetAuthorProfileId,
            String subforumSlug
    ) {}

    public record AdminUserDto(
            Long userId,
            Long profileId,
            String email,
            String alias,
            String role,
            boolean suspended,
            String suspendedReason,
            Instant createdAt,
            long postCount
    ) {}
}
