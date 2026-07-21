package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ForumDtos.SubforumDto;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.SubforumService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subforums")
public class SubforumController {

    private final SubforumService subforumService;

    public SubforumController(SubforumService subforumService) {
        this.subforumService = subforumService;
    }

    @GetMapping
    public List<SubforumDto> list(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return subforumService.listSubforums(profileId(principal));
    }

    @GetMapping("/search")
    public List<SubforumDto> search(
            @RequestParam(required = false, defaultValue = "") String q,
            @AuthenticationPrincipal AuthenticatedProfile principal
    ) {
        return subforumService.searchSubforums(q, profileId(principal));
    }

    @GetMapping("/recommended")
    public List<SubforumDto> recommended(
            @RequestParam(required = false, defaultValue = "5") int limit,
            @AuthenticationPrincipal AuthenticatedProfile principal
    ) {
        return subforumService.recommendedSubforums(profileId(principal), limit);
    }

    @PostMapping("/{slug}/join")
    public SubforumDto join(@PathVariable String slug, @AuthenticationPrincipal AuthenticatedProfile principal) {
        return subforumService.join(slug, principal.profileId());
    }

    @PostMapping("/{slug}/leave")
    public SubforumDto leave(@PathVariable String slug, @AuthenticationPrincipal AuthenticatedProfile principal) {
        return subforumService.leave(slug, principal.profileId());
    }

    private Long profileId(AuthenticatedProfile principal) {
        return principal == null ? null : principal.profileId();
    }
}
