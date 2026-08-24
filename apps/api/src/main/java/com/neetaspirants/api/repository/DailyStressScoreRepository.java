package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.DailyStressScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyStressScoreRepository extends JpaRepository<DailyStressScore, Long> {
    Optional<DailyStressScore> findByProfileIdAndScoreDate(Long profileId, LocalDate scoreDate);

    List<DailyStressScore> findByProfileIdAndScoreDateGreaterThanEqualOrderByScoreDateAsc(
            Long profileId, LocalDate from
    );
}
