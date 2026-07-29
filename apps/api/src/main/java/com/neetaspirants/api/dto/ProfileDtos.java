package com.neetaspirants.api.dto;

import java.time.Instant;

public class ProfileDtos {

    public record PublicProfileDto(
            Long profileId, String alias, String bio, Instant memberSince,
            long followerCount, long followingCount, boolean followingByMe, long postCount
    ) {}

    public record ProfileSearchResultDto(Long profileId, String alias) {}
}
