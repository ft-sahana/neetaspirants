package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.Comment;
import com.neetaspirants.api.domain.Post;
import com.neetaspirants.api.domain.Subforum;
import com.neetaspirants.api.dto.ForumDtos.*;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.CommentRepository;
import com.neetaspirants.api.repository.PostRepository;
import com.neetaspirants.api.repository.SubforumRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final SubforumRepository subforumRepository;
    private final AnonymousProfileRepository profileRepository;
    private final CommentRepository commentRepository;
    private final SlugGenerator slugGenerator;
    private final EmbeddingClient embeddingClient;
    private final QdrantClient qdrantClient;

    public PostService(
            PostRepository postRepository,
            SubforumRepository subforumRepository,
            AnonymousProfileRepository profileRepository,
            CommentRepository commentRepository,
            SlugGenerator slugGenerator,
            EmbeddingClient embeddingClient,
            QdrantClient qdrantClient
    ) {
        this.postRepository = postRepository;
        this.subforumRepository = subforumRepository;
        this.profileRepository = profileRepository;
        this.commentRepository = commentRepository;
        this.slugGenerator = slugGenerator;
        this.embeddingClient = embeddingClient;
        this.qdrantClient = qdrantClient;
    }

    @Transactional(readOnly = true)
    public Page<PostSummaryDto> listPosts(String subforumSlug, String sort, Pageable pageable) {
        Subforum subforum = subforumRepository.findBySlug(subforumSlug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Subforum not found"));

        Page<Post> page = switch (sort == null ? "hot" : sort) {
            case "new" -> postRepository.findBySubforumIdOrderByCreatedAtDesc(subforum.getId(), pageable);
            case "top" -> postRepository.findBySubforumIdOrderByScoreDesc(subforum.getId(), pageable);
            default -> postRepository.findHotBySubforumId(subforum.getId(), pageable);
        };

        return page.map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public PostDetailDto getPostDetail(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));

        List<Comment> flatComments = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        List<CommentDto> tree = buildCommentTree(flatComments);

        return new PostDetailDto(
                post.getId(), post.getSlug(), post.getTitle(), post.getBody(),
                post.getAuthorProfile().getAlias(), post.getSubforum().getSlug(),
                post.getScore(), post.getCreatedAt(), tree
        );
    }

    @Transactional
    public PostDetailDto createPost(Long profileId, CreatePostRequest request) {
        Subforum subforum = subforumRepository.findBySlug(request.subforumSlug())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Subforum not found"));
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        Post post = new Post();
        post.setSubforum(subforum);
        post.setAuthorProfile(profile);
        post.setTitle(request.title());
        post.setBody(request.body());
        post.setSlug(slugGenerator.generateUnique(request.title(), postRepository::existsBySlug));
        post = postRepository.save(post);

        indexForSearch(post);

        return new PostDetailDto(
                post.getId(), post.getSlug(), post.getTitle(), post.getBody(),
                profile.getAlias(), subforum.getSlug(), post.getScore(), post.getCreatedAt(), List.of()
        );
    }

    @Transactional
    public void deletePost(Long postId, Long requestingProfileId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));

        if (!post.getAuthorProfile().getId().equals(requestingProfileId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only delete your own posts");
        }
        postRepository.delete(post);
    }

    private void indexForSearch(Post post) {
        List<Double> vector = embeddingClient.embed(post.getTitle() + ". " + post.getBody());
        Map<String, Object> payload = new HashMap<>();
        payload.put("postId", post.getId());
        payload.put("subforumSlug", post.getSubforum().getSlug());
        payload.put("title", post.getTitle());
        qdrantClient.upsertPoint(post.getId(), vector, payload);
    }

    private PostSummaryDto toSummary(Post post) {
        String excerpt = post.getBody().length() > 220 ? post.getBody().substring(0, 220) + "…" : post.getBody();
        long commentCount = commentRepository.countByPostId(post.getId());
        return new PostSummaryDto(
                post.getId(), post.getSlug(), post.getTitle(), excerpt,
                post.getAuthorProfile().getAlias(), post.getSubforum().getSlug(),
                post.getScore(), commentCount, post.getCreatedAt()
        );
    }

    private List<CommentDto> buildCommentTree(List<Comment> flat) {
        Map<Long, List<Comment>> byParent = new HashMap<>();
        for (Comment c : flat) {
            Long parentId = c.getParentComment() == null ? null : c.getParentComment().getId();
            byParent.computeIfAbsent(parentId, k -> new ArrayList<>()).add(c);
        }
        return buildBranch(null, byParent);
    }

    private List<CommentDto> buildBranch(Long parentId, Map<Long, List<Comment>> byParent) {
        List<Comment> children = byParent.getOrDefault(parentId, List.of());
        List<CommentDto> result = new ArrayList<>();
        for (Comment c : children) {
            List<CommentDto> replies = buildBranch(c.getId(), byParent);
            result.add(new CommentDto(
                    c.getId(), c.getBody(), c.getAuthorProfile().getAlias(), c.getScore(),
                    c.getCreatedAt(), parentId, replies
            ));
        }
        return result;
    }
}
