package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ForumDtos.VoteRequest;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.VoteService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/votes")
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping
    public Map<String, Integer> vote(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @Valid @RequestBody VoteRequest request
    ) {
        int score = voteService.vote(
                principal.profileId(), request.votableType(), request.votableId(), request.value()
        );
        return Map.of("score", score);
    }
}
