package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ForumDtos.CreatePostRequest;
import com.neetaspirants.api.dto.ForumDtos.PostDetailDto;
import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.PostService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping("/subforums/{slug}/posts")
    public Page<PostSummaryDto> listPosts(
            @PathVariable String slug,
            @RequestParam(required = false, defaultValue = "hot") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return postService.listPosts(slug, sort, pageable);
    }

    @GetMapping("/posts/{slug}")
    public PostDetailDto getPost(@PathVariable String slug) {
        return postService.getPostDetail(slug);
    }

    @PostMapping("/posts")
    public PostDetailDto createPost(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @Valid @RequestBody CreatePostRequest request
    ) {
        return postService.createPost(principal.profileId(), request);
    }

    @DeleteMapping("/posts/{id}")
    public void deletePost(@AuthenticationPrincipal AuthenticatedProfile principal, @PathVariable Long id) {
        postService.deletePost(id, principal.profileId());
    }
}
