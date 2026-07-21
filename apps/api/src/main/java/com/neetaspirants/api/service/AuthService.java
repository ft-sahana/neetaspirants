package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.User;
import com.neetaspirants.api.dto.AuthDtos.AuthResponse;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.UserRepository;
import com.neetaspirants.api.security.JwtService;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AnonymousProfileRepository profileRepository;
    private final AliasGenerator aliasGenerator;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            AnonymousProfileRepository profileRepository,
            AliasGenerator aliasGenerator,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.aliasGenerator = aliasGenerator;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse signup(String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user = userRepository.save(user);

        AnonymousProfile profile = new AnonymousProfile();
        profile.setUser(user);
        profile.setAlias(aliasGenerator.generate());
        profile = profileRepository.save(profile);

        String token = jwtService.issueToken(user.getId(), profile.getId(), profile.getAlias());
        return new AuthResponse(token, profile.getId(), profile.getAlias());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        AnonymousProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Profile missing for user"));

        String token = jwtService.issueToken(user.getId(), profile.getId(), profile.getAlias());
        return new AuthResponse(token, profile.getId(), profile.getAlias());
    }
}
