package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recipient_profile_id")
    private AnonymousProfile recipientProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    /** Denormalized alias of whoever triggered the notification, for cheap display. */
    @Column(nullable = false)
    private String actorAlias;

    @Column(nullable = false, length = 500)
    private String message;

    /** Deep-link target. Nullable so future types (e.g. announcements) can omit it. */
    @Column(name = "post_slug")
    private String postSlug;

    @Column(name = "subforum_slug")
    private String subforumSlug;

    // Nullable at the DB level on purpose: with ddl-auto=update, adding a NOT NULL
    // column against a MySQL table in strict mode fails to backfill existing rows
    // ("Data truncation" on ALTER TABLE). Default to unread in the Java field and
    // treat NULL as unread in the repository/service layer instead of enforcing
    // NOT NULL here.
    @Column(name = "is_read")
    private Boolean read = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
