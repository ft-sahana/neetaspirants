package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    boolean existsByFollowerIdAndFolloweeId(Long followerId, Long followeeId);
    Optional<Follow> findByFollowerIdAndFolloweeId(Long followerId, Long followeeId);
    long countByFolloweeId(Long followeeId);
    long countByFollowerId(Long followerId);
    List<Follow> findByFolloweeIdOrderByCreatedAtDesc(Long followeeId);
    List<Follow> findByFollowerIdOrderByCreatedAtDesc(Long followerId);
}
