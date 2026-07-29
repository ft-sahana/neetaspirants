package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.dto.FollowDtos.FollowUserDto;
import com.neetaspirants.api.dto.ProfileDtos.ProfileSearchResultDto;
import com.neetaspirants.api.dto.ProfileDtos.PublicProfileDto;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.FollowService;
import com.neetaspirants.api.service.ProfileService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {

    private final ProfileService profileService;
    private final FollowService followService;

    public ProfileController(ProfileService profileService, FollowService followService) {
        this.profileService = profileService;
        this.followService = followService;
    }

    @GetMapping("/search")
    public List<ProfileSearchResultDto> search(
            @RequestParam(required = false, defaultValue = "") String alias,
            @RequestParam(required = false, defaultValue = "10") int limit,
            @AuthenticationPrincipal AuthenticatedProfile principal
    ) {
        return profileService.searchByAlias(alias, principal.profileId(), limit);
    }

    @GetMapping("/{alias}")
    public PublicProfileDto get(@PathVariable String alias, @AuthenticationPrincipal AuthenticatedProfile principal) {
        return profileService.getPublicProfile(alias, principal.profileId());
    }

    @GetMapping("/{alias}/posts")
    public List<PostSummaryDto> posts(@PathVariable String alias) {
        return profileService.getAuthoredPosts(alias);
    }

    @GetMapping("/{alias}/followers")
    public List<FollowUserDto> followers(@PathVariable String alias) {
        return followService.listFollowers(profileService.getPublicProfile(alias, null).profileId());
    }

    @GetMapping("/{alias}/following")
    public List<FollowUserDto> following(@PathVariable String alias) {
        return followService.listFollowing(profileService.getPublicProfile(alias, null).profileId());
    }

    @PostMapping("/{alias}/follow")
    public void follow(@PathVariable String alias, @AuthenticationPrincipal AuthenticatedProfile principal) {
        followService.follow(principal.profileId(), alias);
    }

    @PostMapping("/{alias}/unfollow")
    public void unfollow(@PathVariable String alias, @AuthenticationPrincipal AuthenticatedProfile principal) {
        followService.unfollow(principal.profileId(), alias);
    }
}
