package com.neetaspirants.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public class ForumDtos {

    public record SubforumDto(
            Long id, String slug, String name, String description, String category,
            String iconEmoji, String bannerImageUrl, List<String> rules,
            long memberCount, boolean joined
    ) {}

    public record PostSummaryDto(
            Long id, String slug, String title, String bodyExcerpt, String imageUrl, String authorAlias,
            String subforumSlug, int score, long commentCount, Instant createdAt
    ) {}

    public record PostDetailDto(
            Long id, String slug, String title, String body, String imageUrl, String authorAlias,
            String subforumSlug, int score, Instant createdAt, List<CommentDto> comments
    ) {}

    public record CommentDto(
            Long id, String body, String authorAlias, int score, Instant createdAt,
            Long parentCommentId, List<CommentDto> replies
    ) {}

    public record CreatePostRequest(
            @NotBlank String subforumSlug,
            @NotBlank @Size(max = 300) String title,
            @NotBlank String body,
            String imageUrl
    ) {}

    public record CreateCommentRequest(
            @NotBlank String body,
            Long parentCommentId
    ) {}

    public record VoteRequest(
            @NotBlank String votableType,
            Long votableId,
            int value
    ) {}
}
