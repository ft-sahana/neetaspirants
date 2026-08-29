package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.SavedPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    boolean existsByProfileIdAndPostId(Long profileId, Long postId);
    Optional<SavedPost> findByProfileIdAndPostId(Long profileId, Long postId);
    List<SavedPost> findTop50ByProfileIdOrderByCreatedAtDesc(Long profileId);
    void deleteByPostId(Long postId);
}
