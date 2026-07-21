package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "subforum_memberships", uniqueConstraints = @UniqueConstraint(columnNames = {"subforum_id", "profile_id"}))
@Getter
@Setter
@NoArgsConstructor
public class SubforumMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "subforum_id")
    private Subforum subforum;

    @ManyToOne(optional = false)
    @JoinColumn(name = "profile_id")
    private AnonymousProfile profile;

    @Column(nullable = false, updatable = false)
    private Instant joinedAt = Instant.now();
}
