package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.Post;
import com.neetaspirants.api.domain.SavedPost;
import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.PostRepository;
import com.neetaspirants.api.repository.SavedPostRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final AnonymousProfileRepository profileRepository;
    private final PostService postService;

    public SavedPostService(
            SavedPostRepository savedPostRepository,
            PostRepository postRepository,
            AnonymousProfileRepository profileRepository,
            PostService postService
    ) {
        this.savedPostRepository = savedPostRepository;
        this.postRepository = postRepository;
        this.profileRepository = profileRepository;
        this.postService = postService;
    }

    @Transactional
    public void save(Long profileId, Long postId) {
        if (savedPostRepository.existsByProfileIdAndPostId(profileId, postId)) return;

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        SavedPost saved = new SavedPost();
        saved.setProfile(profile);
        saved.setPost(post);
        savedPostRepository.save(saved);
    }

    @Transactional
    public void unsave(Long profileId, Long postId) {
        savedPostRepository.findByProfileIdAndPostId(profileId, postId)
                .ifPresent(savedPostRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<Long> listSavedIds(Long profileId) {
        return savedPostRepository.findTop50ByProfileIdOrderByCreatedAtDesc(profileId).stream()
                .map(sp -> sp.getPost().getId())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostSummaryDto> listSavedPosts(Long profileId) {
        return savedPostRepository.findTop50ByProfileIdOrderByCreatedAtDesc(profileId).stream()
                .map(sp -> postService.toSummary(sp.getPost()))
                .toList();
    }
}
