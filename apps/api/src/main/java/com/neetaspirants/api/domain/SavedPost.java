package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
        name = "saved_posts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"profile_id", "post_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class SavedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "profile_id")
    private AnonymousProfile profile;

    @ManyToOne(optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
