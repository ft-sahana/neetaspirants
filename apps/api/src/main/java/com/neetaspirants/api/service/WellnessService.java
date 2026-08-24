package com.neetaspirants.api.service;

import com.neetaspirants.api.dto.WellnessDtos.StressTrendPointDto;
import com.neetaspirants.api.repository.DailyStressScoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class WellnessService {

    private final DailyStressScoreRepository stressScoreRepository;

    public WellnessService(DailyStressScoreRepository stressScoreRepository) {
        this.stressScoreRepository = stressScoreRepository;
    }

    @Transactional(readOnly = true)
    public List<StressTrendPointDto> getStressTrend(Long profileId, int days) {
        LocalDate from = LocalDate.now().minusDays(Math.max(days, 1) - 1L);
        return stressScoreRepository
                .findByProfileIdAndScoreDateGreaterThanEqualOrderByScoreDateAsc(profileId, from)
                .stream()
                .map(s -> new StressTrendPointDto(s.getScoreDate(), s.getAvgScore(), s.getSampleCount()))
                .toList();
    }
}
