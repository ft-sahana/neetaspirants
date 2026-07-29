package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.DailyActivity;
import com.neetaspirants.api.dto.ActivityDtos.HeartbeatResponse;
import com.neetaspirants.api.dto.ActivityDtos.StreakDto;
import com.neetaspirants.api.dto.ActivityDtos.TimeSpentDto;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.DailyActivityRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StreakService {

    private static final ZoneId STREAK_ZONE = ZoneId.of("Asia/Kolkata");

    private final DailyActivityRepository dailyActivityRepository;
    private final AnonymousProfileRepository profileRepository;

    public StreakService(
            DailyActivityRepository dailyActivityRepository,
            AnonymousProfileRepository profileRepository
    ) {
        this.dailyActivityRepository = dailyActivityRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public HeartbeatResponse heartbeat(Long profileId, int seconds) {
        int clamped = Math.max(0, Math.min(seconds, 300));
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        long current = profile.getTotalActiveSeconds() == null ? 0L : profile.getTotalActiveSeconds();
        profile.setTotalActiveSeconds(current + clamped);
        profileRepository.save(profile);

        LocalDate today = LocalDate.now(STREAK_ZONE);
        if (!dailyActivityRepository.existsByProfileIdAndActivityDate(profileId, today)) {
            try {
                DailyActivity activity = new DailyActivity();
                activity.setProfile(profile);
                activity.setActivityDate(today);
                dailyActivityRepository.save(activity);
            } catch (DataIntegrityViolationException ignored) {
                // Concurrent tabs raced to record today — the row already exists, nothing to do.
            }
        }

        StreakDto streak = getStreak(profileId);
        return new HeartbeatResponse(profile.getTotalActiveSeconds(), streak.currentStreak(), streak.activeToday());
    }

    @Transactional(readOnly = true)
    public StreakDto getStreak(Long profileId) {
        LocalDate today = LocalDate.now(STREAK_ZONE);
        Set<LocalDate> days = dailyActivityRepository.findByProfileIdOrderByActivityDateDesc(profileId).stream()
                .map(DailyActivity::getActivityDate)
                .collect(Collectors.toSet());

        boolean activeToday = days.contains(today);
        LocalDate cursor = activeToday ? today : today.minusDays(1);
        int streak = 0;
        while (days.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return new StreakDto(streak, activeToday);
    }

    @Transactional(readOnly = true)
    public TimeSpentDto getTimeSpent(Long profileId) {
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));
        long total = profile.getTotalActiveSeconds() == null ? 0L : profile.getTotalActiveSeconds();
        return new TimeSpentDto(total);
    }
}
