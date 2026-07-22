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
    private final NotificationService notificationService;

    public VoteService(
            VoteRepository voteRepository,
            PostRepository postRepository,
            CommentRepository commentRepository,
            AnonymousProfileRepository profileRepository,
            NotificationService notificationService
    ) {
        this.voteRepository = voteRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
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
        boolean alreadyUpvoted = vote.getId() != null && vote.getValue() == 1;

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
        ScoreTarget target = applyScore(votableType, votableId, newScore);

        if (value == 1 && !alreadyUpvoted) {
            notifyUpvote(votableType, target, profile);
        }

        return newScore;
    }

    private void notifyUpvote(VotableType type, ScoreTarget target, AnonymousProfile voter) {
        if (target.author() == null || target.post() == null) return;
        if (target.author().getId().equals(voter.getId())) return; // don't notify yourself
        String targetKind = type == VotableType.POST ? "post" : "comment";
        notificationService.notifyUpvote(
                target.author().getId(), voter.getId(), voter.getAlias(), targetKind,
                target.post().getSlug(), target.post().getSubforum().getSlug()
        );
    }

    private ScoreTarget applyScore(VotableType type, Long id, int newScore) {
        if (type == VotableType.POST) {
            Post post = postRepository.findById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));
            post.setScore(newScore);
            postRepository.save(post);
            return new ScoreTarget(post.getAuthorProfile(), post);
        } else {
            Comment comment = commentRepository.findById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));
            comment.setScore(newScore);
            commentRepository.save(comment);
            return new ScoreTarget(comment.getAuthorProfile(), comment.getPost());
        }
    }

    private record ScoreTarget(AnonymousProfile author, Post post) {}

    private VotableType parseType(String raw) {
        try {
            return VotableType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "votableType must be POST or COMMENT");
        }
    }
}
