package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.RefreshToken;
import com.neetaspirants.api.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long expirationDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.refresh-token.expiration-days}") long expirationDays
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.expirationDays = expirationDays;
    }

    @Transactional
    public String issue(Long userId) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokenRepository.save(new RefreshToken(userId, hash(rawToken), Instant.now().plus(Duration.ofDays(expirationDays))));
        return rawToken;
    }

    @Transactional
    public Optional<Long> rotate(String rawToken) {
        return refreshTokenRepository.findByTokenHash(hash(rawToken))
                .filter(rt -> rt.getExpiresAt().isAfter(Instant.now()))
                .map(rt -> {
                    refreshTokenRepository.delete(rt);
                    return rt.getUserId();
                });
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null) return;
        refreshTokenRepository.deleteByTokenHash(hash(rawToken));
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest.digest(rawToken.getBytes()));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
