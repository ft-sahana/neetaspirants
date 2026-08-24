package com.neetaspirants.api.config;

import com.neetaspirants.api.domain.Role;
import com.neetaspirants.api.domain.User;
import com.neetaspirants.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final String adminEmail;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            @Value("${app.admin.bootstrap-email:}") String adminEmail
    ) {
        this.userRepository = userRepository;
        this.adminEmail = adminEmail;
    }

    @Override
    public void run(String... args) {
        if (adminEmail == null || adminEmail.isBlank()) {
            return;
        }

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                user -> {
                    if (user.getRole() != Role.ADMIN) {
                        user.setRole(Role.ADMIN);
                        userRepository.save(user);
                        log.info("Promoted {} to ADMIN via app.admin.bootstrap-email", adminEmail);
                    }
                },
                () -> log.warn(
                        "app.admin.bootstrap-email is set to {} but no account with that email exists yet — sign up first, then restart",
                        adminEmail
                )
        );
    }
}
