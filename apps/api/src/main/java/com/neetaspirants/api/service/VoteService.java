package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.*;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.CommentRepository;
import com.neetaspirants.api.repository.PostRepository;
import com.neetaspirants.api.repository.VoteRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VoteService {

    private final VoteRepository voteRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final AnonymousProfileRepository profileRepository;

    public VoteService(
            VoteRepository voteRepository,
            PostRepository postRepository,
            CommentRepository commentRepository,
            AnonymousProfileRepository profileRepository
    ) {
        this.voteRepository = voteRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public int vote(Long profileId, String votableTypeRaw, Long votableId, int value) {
        if (value < -1 || value > 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "value must be -1, 0, or 1");
        }
        VotableType votableType = parseType(votableTypeRaw);
        var profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        Vote vote = voteRepository
                .findByVotableTypeAndVotableIdAndProfileId(votableType, votableId, profileId)
                .orElseGet(Vote::new);

        if (value == 0) {
            if (vote.getId() != null) voteRepository.delete(vote);
        } else {
            vote.setVotableType(votableType);
            vote.setVotableId(votableId);
            vote.setProfile(profile);
            vote.setValue(value);
            voteRepository.save(vote);
        }

        int newScore = voteRepository.sumScoreFor(votableType, votableId);
        applyScore(votableType, votableId, newScore);
        return newScore;
    }

    private void applyScore(VotableType type, Long id, int newScore) {
        if (type == VotableType.POST) {
            Post post = postRepository.findById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));
            post.setScore(newScore);
            postRepository.save(post);
        } else {
            Comment comment = commentRepository.findById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));
            comment.setScore(newScore);
            commentRepository.save(comment);
        }
    }

    private VotableType parseType(String raw) {
        try {
            return VotableType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "votableType must be POST or COMMENT");
        }
    }
}
