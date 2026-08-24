package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.WellnessDtos.StressTrendPointDto;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.WellnessService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wellness")
public class WellnessController {

    private final WellnessService wellnessService;

    public WellnessController(WellnessService wellnessService) {
        this.wellnessService = wellnessService;
    }

    @GetMapping("/stress-trend")
    public List<StressTrendPointDto> getStressTrend(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @RequestParam(required = false, defaultValue = "30") int days
    ) {
        return wellnessService.getStressTrend(principal.profileId(), days);
    }
}
