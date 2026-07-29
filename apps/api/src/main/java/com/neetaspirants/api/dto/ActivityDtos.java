package com.neetaspirants.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class ActivityDtos {

    public record CommentSummaryDto(
            Long id, String body, String postSlug, String postTitle,
            String subforumSlug, int score, Instant createdAt
    ) {}

    public record StreakDto(int currentStreak, boolean activeToday) {}

    public record TimeSpentDto(long totalSeconds) {}

    public record HeartbeatRequest(@Min(0) @Max(300) int seconds) {}

    public record HeartbeatResponse(long totalSeconds, int currentStreak, boolean activeToday) {}

    public record MeSummaryDto(
            String alias, String bio, long followerCount, long followingCount,
            int currentStreak, boolean activeToday, long totalActiveSeconds, Instant memberSince
    ) {}

    public record UpdateBioRequest(@Size(max = 280) String bio) {}
}
