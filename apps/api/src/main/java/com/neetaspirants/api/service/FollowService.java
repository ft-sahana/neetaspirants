package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.Follow;
import com.neetaspirants.api.dto.FollowDtos.FollowUserDto;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.FollowRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final AnonymousProfileRepository profileRepository;
    private final NotificationService notificationService;

    public FollowService(
            FollowRepository followRepository,
            AnonymousProfileRepository profileRepository,
            NotificationService notificationService
    ) {
        this.followRepository = followRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public void follow(Long followerId, String followeeAlias) {
        AnonymousProfile followee = profileRepository.findByAlias(followeeAlias)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));
        if (followee.getId().equals(followerId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot follow yourself");
        }
        if (followRepository.existsByFollowerIdAndFolloweeId(followerId, followee.getId())) {
            return;
        }
        AnonymousProfile follower = profileRepository.findById(followerId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowee(followee);
        followRepository.save(follow);

        notificationService.notifyFollow(followee.getId(), follower.getId(), follower.getAlias());
    }

    @Transactional
    public void unfollow(Long followerId, String followeeAlias) {
        AnonymousProfile followee = profileRepository.findByAlias(followeeAlias)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));
        followRepository.findByFollowerIdAndFolloweeId(followerId, followee.getId())
                .ifPresent(followRepository::delete);
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(Long followerId, Long followeeId) {
        return followRepository.existsByFollowerIdAndFolloweeId(followerId, followeeId);
    }

    @Transactional(readOnly = true)
    public long followerCount(Long profileId) {
        return followRepository.countByFolloweeId(profileId);
    }

    @Transactional(readOnly = true)
    public long followingCount(Long profileId) {
        return followRepository.countByFollowerId(profileId);
    }

    @Transactional(readOnly = true)
    public List<FollowUserDto> listFollowers(Long profileId) {
        return followRepository.findByFolloweeIdOrderByCreatedAtDesc(profileId).stream()
                .map(f -> new FollowUserDto(f.getFollower().getId(), f.getFollower().getAlias()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FollowUserDto> listFollowing(Long profileId) {
        return followRepository.findByFollowerIdOrderByCreatedAtDesc(profileId).stream()
                .map(f -> new FollowUserDto(f.getFollowee().getId(), f.getFollowee().getAlias()))
                .toList();
    }
}
