package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @ManyToOne(optional = false)
    @JoinColumn(name = "author_profile_id")
    private AnonymousProfile authorProfile;

    @Lob
    @Column(nullable = false)
    private String body;

    @Column(nullable = false)
    private int score = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
