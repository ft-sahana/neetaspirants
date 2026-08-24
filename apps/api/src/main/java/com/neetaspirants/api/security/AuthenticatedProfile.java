package com.neetaspirants.api.security;

public record AuthenticatedProfile(Long userId, Long profileId, String alias, String role) {
    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
