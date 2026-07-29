package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Post> findTop50ByAuthorProfileIdOrderByCreatedAtDesc(Long authorProfileId);

    long countByAuthorProfileId(Long authorProfileId);

    Page<Post> findBySubforumIdOrderByCreatedAtDesc(Long subforumId, Pageable pageable);

    Page<Post> findBySubforumIdOrderByScoreDesc(Long subforumId, Pageable pageable);

    @Query(
            value = "SELECT * FROM posts p WHERE p.subforum_id = :subforumId " +
                    "ORDER BY p.score / POWER(TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 2, 1.5) DESC",
            countQuery = "SELECT count(*) FROM posts p WHERE p.subforum_id = :subforumId",
            nativeQuery = true
    )
    Page<Post> findHotBySubforumId(@Param("subforumId") Long subforumId, Pageable pageable);
}
