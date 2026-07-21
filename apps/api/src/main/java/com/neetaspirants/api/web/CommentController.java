package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ForumDtos.CommentDto;
import com.neetaspirants.api.dto.ForumDtos.CreateCommentRequest;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/posts/{postId}/comments")
    public CommentDto addComment(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return commentService.addComment(postId, principal.profileId(), request);
    }

    @DeleteMapping("/comments/{id}")
    public void deleteComment(@AuthenticationPrincipal AuthenticatedProfile principal, @PathVariable Long id) {
        commentService.deleteComment(id, principal.profileId());
    }
}
