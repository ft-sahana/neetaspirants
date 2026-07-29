package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "anonymous_profiles")
@Getter
@Setter
@NoArgsConstructor
public class AnonymousProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String alias;

    @Column(length = 280)
    private String bio;

    // Nullable at the DB level on purpose (same ddl-auto=update/MySQL-strict-mode
    // backfill gotcha as Notification.read): default to 0 in service code, not here.
    @Column(name = "total_active_seconds")
    private Long totalActiveSeconds;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
