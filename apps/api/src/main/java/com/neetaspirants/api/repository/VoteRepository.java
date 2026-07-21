package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.VotableType;
import com.neetaspirants.api.domain.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByVotableTypeAndVotableIdAndProfileId(
            VotableType votableType, Long votableId, Long profileId
    );

    @org.springframework.data.jpa.repository.Query(
            "SELECT COALESCE(SUM(v.value), 0) FROM Vote v WHERE v.votableType = :type AND v.votableId = :votableId"
    )
    int sumScoreFor(VotableType type, Long votableId);
}
