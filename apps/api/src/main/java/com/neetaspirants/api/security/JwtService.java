package com.neetaspirants.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMinutes;

    private static final String INSECURE_DEFAULT_SECRET = "dev-only-secret-change-me-please-this-is-not-secure-32bytes";

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes,
            @Value("${spring.profiles.active:dev}") String activeProfile
    ) {
        if (INSECURE_DEFAULT_SECRET.equals(secret) && !activeProfile.toLowerCase().contains("dev")) {
            throw new IllegalStateException(
                    "JWT_SECRET is not set. Refusing to start with the default development secret outside the dev profile.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMinutes = expirationMinutes;
    }

    public String issueToken(Long userId, Long profileId, String alias, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("profileId", profileId)
                .claim("alias", alias)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(Duration.ofMinutes(expirationMinutes))))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
