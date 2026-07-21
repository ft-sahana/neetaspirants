package com.neetaspirants.api.security;

public record AuthenticatedProfile(Long userId, Long profileId, String alias) {
}
