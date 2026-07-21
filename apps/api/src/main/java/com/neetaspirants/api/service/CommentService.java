package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.Comment;
import com.neetaspirants.api.domain.Post;
import com.neetaspirants.api.dto.ForumDtos.CommentDto;
import com.neetaspirants.api.dto.ForumDtos.CreateCommentRequest;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.CommentRepository;
import com.neetaspirants.api.repository.PostRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final AnonymousProfileRepository profileRepository;

    public CommentService(
            CommentRepository commentRepository,
            PostRepository postRepository,
            AnonymousProfileRepository profileRepository
    ) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public CommentDto addComment(Long postId, Long profileId, CreateCommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthorProfile(profile);
        comment.setBody(request.body());

        if (request.parentCommentId() != null) {
            Comment parent = commentRepository.findById(request.parentCommentId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Parent comment not found"));
            comment.setParentComment(parent);
        }

        comment = commentRepository.save(comment);

        return new CommentDto(
                comment.getId(), comment.getBody(), profile.getAlias(), comment.getScore(),
                comment.getCreatedAt(), request.parentCommentId(), List.of()
        );
    }

    @Transactional
    public void deleteComment(Long commentId, Long requestingProfileId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getAuthorProfile().getId().equals(requestingProfileId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only delete your own comments");
        }
        commentRepository.delete(comment);
    }
}
