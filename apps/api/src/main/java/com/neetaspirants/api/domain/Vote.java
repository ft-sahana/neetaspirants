package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "votes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"votable_type", "votable_id", "profile_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "votable_type", nullable = false)
    private VotableType votableType;

    @Column(name = "votable_id", nullable = false)
    private Long votableId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "profile_id")
    private AnonymousProfile profile;

    @Column(nullable = false)
    private int value;
}
