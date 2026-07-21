package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.SubforumMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubforumMembershipRepository extends JpaRepository<SubforumMembership, Long> {
    boolean existsBySubforumIdAndProfileId(Long subforumId, Long profileId);

    Optional<SubforumMembership> findBySubforumIdAndProfileId(Long subforumId, Long profileId);

    long countBySubforumId(Long subforumId);

    List<SubforumMembership> findByProfileId(Long profileId);
}
