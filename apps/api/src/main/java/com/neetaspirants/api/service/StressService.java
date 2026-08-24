package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.DailyStressScore;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.DailyStressScoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;

@Service
public class StressService {

    private static final Logger log = LoggerFactory.getLogger(StressService.class);

    private final StressClient stressClient;
    private final DailyStressScoreRepository stressScoreRepository;
    private final AnonymousProfileRepository profileRepository;

    public StressService(
            StressClient stressClient,
            DailyStressScoreRepository stressScoreRepository,
            AnonymousProfileRepository profileRepository
    ) {
        this.stressClient = stressClient;
        this.stressScoreRepository = stressScoreRepository;
        this.profileRepository = profileRepository;
    }

    /** Best-effort: feeds the author's private wellness trend, must never affect the post/comment itself. */
    @Async
    @Transactional
    public void recordStress(Long profileId, String text) {
        try {
            StressClient.StressResult result = stressClient.check(text);
            LocalDate today = LocalDate.now();

            DailyStressScore score = stressScoreRepository.findByProfileIdAndScoreDate(profileId, today)
                    .orElseGet(() -> {
                        DailyStressScore fresh = new DailyStressScore();
                        fresh.setProfile(profileRepository.getReferenceById(profileId));
                        fresh.setScoreDate(today);
                        fresh.setAvgScore(0.0);
                        fresh.setSampleCount(0);
                        return fresh;
                    });

            int newCount = score.getSampleCount() + 1;
            double newAvg = (score.getAvgScore() * score.getSampleCount() + result.score()) / newCount;
            score.setAvgScore(newAvg);
            score.setSampleCount(newCount);
            score.setUpdatedAt(Instant.now());

            stressScoreRepository.save(score);
        } catch (Exception e) {
            log.warn("Stress tracking failed for profile {}: {}", profileId, e.getMessage());
        }
    }
}
