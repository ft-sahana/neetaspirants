package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ActivityDtos.*;
import com.neetaspirants.api.dto.ChatDtos.ChatRoomDto;
import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.dto.ForumDtos.SubforumDto;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.ActivityService;
import com.neetaspirants.api.service.ProfileService;
import com.neetaspirants.api.service.StreakService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final ProfileService profileService;
    private final ActivityService activityService;
    private final StreakService streakService;

    public MeController(ProfileService profileService, ActivityService activityService, StreakService streakService) {
        this.profileService = profileService;
        this.activityService = activityService;
        this.streakService = streakService;
    }

    @GetMapping
    public MeSummaryDto me(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return profileService.getMeSummary(principal.profileId());
    }

    @PutMapping("/bio")
    public void updateBio(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @Valid @RequestBody UpdateBioRequest request
    ) {
        profileService.updateBio(principal.profileId(), request.bio());
    }

    @GetMapping("/activity/posts")
    public List<PostSummaryDto> posts(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return activityService.authoredPosts(principal.profileId());
    }

    @GetMapping("/activity/comments")
    public List<CommentSummaryDto> comments(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return activityService.authoredComments(principal.profileId());
    }

    @GetMapping("/activity/liked-posts")
    public List<PostSummaryDto> likedPosts(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return activityService.likedPosts(principal.profileId());
    }

    @GetMapping("/activity/liked-comments")
    public List<CommentSummaryDto> likedComments(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return activityService.likedComments(principal.profileId());
    }

    @GetMapping("/activity/communities")
    public List<SubforumDto> communities(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return activityService.joinedCommunities(principal.profileId());
    }

    @GetMapping("/activity/rooms")
    public List<ChatRoomDto> rooms(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return activityService.joinedRooms(principal.profileId());
    }

    @GetMapping("/activity/streak")
    public StreakDto streak(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return streakService.getStreak(principal.profileId());
    }

    @GetMapping("/activity/time-spent")
    public TimeSpentDto timeSpent(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return streakService.getTimeSpent(principal.profileId());
    }

    @PostMapping("/heartbeat")
    public HeartbeatResponse heartbeat(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @Valid @RequestBody HeartbeatRequest request
    ) {
        return streakService.heartbeat(principal.profileId(), request.seconds());
    }
}
