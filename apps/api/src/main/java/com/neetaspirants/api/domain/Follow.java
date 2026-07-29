package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
        name = "follows",
        uniqueConstraints = @UniqueConstraint(columnNames = {"follower_profile_id", "followee_profile_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "follower_profile_id")
    private AnonymousProfile follower;

    @ManyToOne(optional = false)
    @JoinColumn(name = "followee_profile_id")
    private AnonymousProfile followee;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
