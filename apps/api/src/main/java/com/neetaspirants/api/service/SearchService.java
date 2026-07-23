package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.Post;
import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.repository.CommentRepository;
import com.neetaspirants.api.repository.PostRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class SearchService {

    private final EmbeddingClient embeddingClient;
    private final QdrantClient qdrantClient;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public SearchService(
            EmbeddingClient embeddingClient,
            QdrantClient qdrantClient,
            PostRepository postRepository,
            CommentRepository commentRepository
    ) {
        this.embeddingClient = embeddingClient;
        this.qdrantClient = qdrantClient;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
    }

    public List<PostSummaryDto> search(String query, int limit) {
        List<Double> vector = embeddingClient.embed(query);
        List<Map<String, Object>> hits = qdrantClient.search(vector, limit);

        List<PostSummaryDto> results = new ArrayList<>();
        for (Map<String, Object> hit : hits) {
            Object idRaw = hit.get("id");
            Long postId = idRaw instanceof Number number ? number.longValue() : null;
            if (postId == null) continue;

            postRepository.findById(postId).ifPresent(post -> results.add(toSummary(post)));
        }
        return results;
    }

    private PostSummaryDto toSummary(Post post) {
        String excerpt = post.getBody().length() > 220 ? post.getBody().substring(0, 220) + "…" : post.getBody();
        long commentCount = commentRepository.countByPostId(post.getId());
        return new PostSummaryDto(
                post.getId(), post.getSlug(), post.getTitle(), excerpt, post.getImageUrl(),
                post.getAuthorProfile().getAlias(), post.getSubforum().getSlug(),
                post.getScore(), commentCount, post.getCreatedAt()
        );
    }
}
