package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.Comment;
import com.neetaspirants.api.domain.Post;
import com.neetaspirants.api.domain.VotableType;
import com.neetaspirants.api.domain.Vote;
import com.neetaspirants.api.dto.ActivityDtos.CommentSummaryDto;
import com.neetaspirants.api.dto.ChatDtos.ChatRoomDto;
import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.dto.ForumDtos.SubforumDto;
import com.neetaspirants.api.repository.CommentRepository;
import com.neetaspirants.api.repository.PostRepository;
import com.neetaspirants.api.repository.SubforumMembershipRepository;
import com.neetaspirants.api.repository.VoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final SubforumMembershipRepository membershipRepository;
    private final PostService postService;
    private final SubforumService subforumService;
    private final ChatService chatService;

    public ActivityService(
            PostRepository postRepository,
            CommentRepository commentRepository,
            VoteRepository voteRepository,
            SubforumMembershipRepository membershipRepository,
            PostService postService,
            SubforumService subforumService,
            ChatService chatService
    ) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.voteRepository = voteRepository;
        this.membershipRepository = membershipRepository;
        this.postService = postService;
        this.subforumService = subforumService;
        this.chatService = chatService;
    }

    @Transactional(readOnly = true)
    public List<PostSummaryDto> authoredPosts(Long profileId) {
        return postRepository.findTop50ByAuthorProfileIdOrderByCreatedAtDesc(profileId).stream()
                .map(postService::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CommentSummaryDto> authoredComments(Long profileId) {
        return commentRepository.findTop50ByAuthorProfileIdOrderByCreatedAtDesc(profileId).stream()
                .map(this::toCommentSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostSummaryDto> likedPosts(Long profileId) {
        List<Vote> votes = voteRepository.findTop50ByProfileIdAndVotableTypeAndValueOrderByIdDesc(
                profileId, VotableType.POST, 1
        );
        Map<Long, Post> byId = postRepository.findAllById(votes.stream().map(Vote::getVotableId).toList())
                .stream().collect(Collectors.toMap(Post::getId, p -> p));
        return votes.stream()
                .map(v -> byId.get(v.getVotableId()))
                .filter(java.util.Objects::nonNull)
                .map(postService::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CommentSummaryDto> likedComments(Long profileId) {
        List<Vote> votes = voteRepository.findTop50ByProfileIdAndVotableTypeAndValueOrderByIdDesc(
                profileId, VotableType.COMMENT, 1
        );
        Map<Long, Comment> byId = commentRepository.findAllById(votes.stream().map(Vote::getVotableId).toList())
                .stream().collect(Collectors.toMap(Comment::getId, c -> c));
        return votes.stream()
                .map(v -> byId.get(v.getVotableId()))
                .filter(java.util.Objects::nonNull)
                .map(this::toCommentSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubforumDto> joinedCommunities(Long profileId) {
        return membershipRepository.findByProfileId(profileId).stream()
                .map(m -> subforumService.toDto(m.getSubforum(), profileId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDto> joinedRooms(Long profileId) {
        return chatService.listJoinedGroupRooms(profileId);
    }

    private CommentSummaryDto toCommentSummary(Comment c) {
        Post post = c.getPost();
        return new CommentSummaryDto(
                c.getId(), c.getBody(), post.getSlug(), post.getTitle(),
                post.getSubforum().getSlug(), c.getScore(), c.getCreatedAt()
        );
    }
}
