package com.neetaspirants.api.dto;

public class FollowDtos {

    public record FollowUserDto(Long profileId, String alias) {}

    public record FollowActionDto(boolean following, long followerCount) {}
}
