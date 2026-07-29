package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "profile_activity_days",
        uniqueConstraints = @UniqueConstraint(columnNames = {"profile_id", "activity_date"})
)
@Getter
@Setter
@NoArgsConstructor
public class DailyActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "profile_id")
    private AnonymousProfile profile;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
