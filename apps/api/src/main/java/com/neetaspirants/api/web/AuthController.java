package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.AuthDtos.AuthResponse;
import com.neetaspirants.api.dto.AuthDtos.AuthResult;
import com.neetaspirants.api.dto.AuthDtos.LoginRequest;
import com.neetaspirants.api.dto.AuthDtos.SignupRequest;
import com.neetaspirants.api.security.RateLimiter;
import com.neetaspirants.api.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "neetaspirants_refresh_token";

    private final AuthService authService;
    private final RateLimiter rateLimiter;
    private final boolean cookieSecure;
    private final long refreshExpirationDays;

    public AuthController(
            AuthService authService,
            RateLimiter rateLimiter,
            @Value("${app.cookie.secure}") boolean cookieSecure,
            @Value("${app.refresh-token.expiration-days}") long refreshExpirationDays
    ) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
        this.cookieSecure = cookieSecure;
        this.refreshExpirationDays = refreshExpirationDays;
    }

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        enforceRateLimit("signup:" + clientIp(httpRequest), 5, Duration.ofHours(1));
        AuthResult result = authService.signup(request.email(), request.password());
        setRefreshCookie(httpResponse, result.refreshToken());
        return result.response();
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        enforceRateLimit("login:" + clientIp(httpRequest), 10, Duration.ofMinutes(5));
        AuthResult result = authService.login(request.email(), request.password());
        setRefreshCookie(httpResponse, result.refreshToken());
        return result.response();
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        enforceRateLimit("refresh:" + clientIp(httpRequest), 30, Duration.ofMinutes(5));
        String rawRefreshToken = readRefreshCookie(httpRequest);
        if (rawRefreshToken == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "No refresh token");
        }
        AuthResult result = authService.refresh(rawRefreshToken);
        setRefreshCookie(httpResponse, result.refreshToken());
        return result.response();
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        authService.logout(readRefreshCookie(httpRequest));
        clearRefreshCookie(httpResponse);
    }

    private void enforceRateLimit(String key, int maxAttempts, Duration window) {
        if (!rateLimiter.tryConsume(key, maxAttempts, window)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Please try again later.");
        }
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void setRefreshCookie(HttpServletResponse response, String rawRefreshToken) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(rawRefreshToken, Duration.ofDays(refreshExpirationDays)).toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("", Duration.ZERO).toString());
    }

    private ResponseCookie buildCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(maxAge)
                .build();
    }

    private String readRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
