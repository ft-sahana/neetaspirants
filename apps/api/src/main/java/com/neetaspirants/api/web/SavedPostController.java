package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.SavedPostService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/saved-posts")
public class SavedPostController {

    private final SavedPostService savedPostService;

    public SavedPostController(SavedPostService savedPostService) {
        this.savedPostService = savedPostService;
    }

    @GetMapping
    public List<PostSummaryDto> list(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return savedPostService.listSavedPosts(principal.profileId());
    }

    @GetMapping("/ids")
    public List<Long> listIds(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return savedPostService.listSavedIds(principal.profileId());
    }

    @PostMapping("/{postId}")
    public void save(@PathVariable Long postId, @AuthenticationPrincipal AuthenticatedProfile principal) {
        savedPostService.save(principal.profileId(), postId);
    }

    @DeleteMapping("/{postId}")
    public void unsave(@PathVariable Long postId, @AuthenticationPrincipal AuthenticatedProfile principal) {
        savedPostService.unsave(principal.profileId(), postId);
    }
}
