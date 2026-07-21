package com.neetaspirants.api.ws;

import java.security.Principal;

public record StompPrincipal(Long userId, Long profileId, String alias) implements Principal {
    @Override
    public String getName() {
        return alias;
    }
}
