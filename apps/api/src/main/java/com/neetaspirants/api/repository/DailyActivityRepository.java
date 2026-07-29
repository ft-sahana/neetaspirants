package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.DailyActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, Long> {
    boolean existsByProfileIdAndActivityDate(Long profileId, LocalDate activityDate);
    List<DailyActivity> findByProfileIdOrderByActivityDateDesc(Long profileId);
}
