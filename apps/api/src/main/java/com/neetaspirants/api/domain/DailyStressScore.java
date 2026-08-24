package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "daily_stress_scores",
        uniqueConstraints = @UniqueConstraint(columnNames = {"profile_id", "score_date"})
)
@Getter
@Setter
@NoArgsConstructor
public class DailyStressScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "profile_id")
    private AnonymousProfile profile;

    @Column(name = "score_date", nullable = false)
    private LocalDate scoreDate;

    @Column(name = "avg_score", nullable = false)
    private double avgScore;

    @Column(name = "sample_count", nullable = false)
    private int sampleCount;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
