package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.dto.ActivityDtos.MeSummaryDto;
import com.neetaspirants.api.dto.ActivityDtos.StreakDto;
import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.dto.ProfileDtos.ProfileSearchResultDto;
import com.neetaspirants.api.dto.ProfileDtos.PublicProfileDto;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.PostRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfileService {

    private final AnonymousProfileRepository profileRepository;
    private final PostRepository postRepository;
    private final FollowService followService;
    private final StreakService streakService;
    private final PostService postService;

    public ProfileService(
            AnonymousProfileRepository profileRepository,
            PostRepository postRepository,
            FollowService followService,
            StreakService streakService,
            PostService postService
    ) {
        this.profileRepository = profileRepository;
        this.postRepository = postRepository;
        this.followService = followService;
        this.streakService = streakService;
        this.postService = postService;
    }

    @Transactional(readOnly = true)
    public List<PostSummaryDto> getAuthoredPosts(String alias) {
        AnonymousProfile profile = profileRepository.findByAlias(alias)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));
        return postRepository.findTop50ByAuthorProfileIdOrderByCreatedAtDesc(profile.getId()).stream()
                .map(postService::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public MeSummaryDto getMeSummary(Long profileId) {
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));
        StreakDto streak = streakService.getStreak(profileId);
        long totalActiveSeconds = profile.getTotalActiveSeconds() == null ? 0L : profile.getTotalActiveSeconds();
        return new MeSummaryDto(
                profile.getAlias(), profile.getBio(),
                followService.followerCount(profileId), followService.followingCount(profileId),
                streak.currentStreak(), streak.activeToday(), totalActiveSeconds, profile.getCreatedAt()
        );
    }

    @Transactional
    public void updateBio(Long profileId, String bio) {
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));
        profile.setBio(bio == null || bio.isBlank() ? null : bio.trim());
        profileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public PublicProfileDto getPublicProfile(String alias, Long viewerProfileId) {
        AnonymousProfile profile = profileRepository.findByAlias(alias)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));

        boolean followingByMe = viewerProfileId != null
                && !viewerProfileId.equals(profile.getId())
                && followService.isFollowing(viewerProfileId, profile.getId());

        return new PublicProfileDto(
                profile.getId(), profile.getAlias(), profile.getBio(), profile.getCreatedAt(),
                followService.followerCount(profile.getId()), followService.followingCount(profile.getId()),
                followingByMe, postRepository.countByAuthorProfileId(profile.getId())
        );
    }

    @Transactional(readOnly = true)
    public List<ProfileSearchResultDto> searchByAlias(String query, Long excludeProfileId, int limit) {
        if (query == null || query.isBlank()) return List.of();
        return profileRepository.findTop10ByAliasContainingIgnoreCaseAndIdNot(query.trim(), excludeProfileId).stream()
                .limit(limit)
                .map(p -> new ProfileSearchResultDto(p.getId(), p.getAlias()))
                .toList();
    }
}
