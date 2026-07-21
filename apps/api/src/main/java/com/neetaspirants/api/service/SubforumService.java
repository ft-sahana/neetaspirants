package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.Subforum;
import com.neetaspirants.api.domain.SubforumMembership;
import com.neetaspirants.api.dto.ForumDtos.SubforumDto;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.SubforumMembershipRepository;
import com.neetaspirants.api.repository.SubforumRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
public class SubforumService {

    private final SubforumRepository subforumRepository;
    private final SubforumMembershipRepository membershipRepository;
    private final AnonymousProfileRepository profileRepository;

    public SubforumService(
            SubforumRepository subforumRepository,
            SubforumMembershipRepository membershipRepository,
            AnonymousProfileRepository profileRepository
    ) {
        this.subforumRepository = subforumRepository;
        this.membershipRepository = membershipRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public List<SubforumDto> listSubforums(Long profileId) {
        return subforumRepository.findAll().stream()
                .map(s -> toDto(s, profileId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubforumDto> searchSubforums(String query, Long profileId) {
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (q.isEmpty()) return listSubforums(profileId);

        return subforumRepository.findAll().stream()
                .filter(s -> s.getName().toLowerCase(Locale.ROOT).contains(q)
                        || s.getSlug().toLowerCase(Locale.ROOT).contains(q)
                        || s.getCategory().toLowerCase(Locale.ROOT).contains(q)
                        || (s.getDescription() != null && s.getDescription().toLowerCase(Locale.ROOT).contains(q)))
                .map(s -> toDto(s, profileId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubforumDto> recommendedSubforums(Long profileId, int limit) {
        return subforumRepository.findAll().stream()
                .map(s -> toDto(s, profileId))
                .filter(dto -> !dto.joined())
                .sorted((a, b) -> Long.compare(b.memberCount(), a.memberCount()))
                .limit(limit)
                .toList();
    }

    @Transactional
    public SubforumDto join(String slug, Long profileId) {
        Subforum subforum = subforumRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Subforum not found"));
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        if (!membershipRepository.existsBySubforumIdAndProfileId(subforum.getId(), profileId)) {
            SubforumMembership membership = new SubforumMembership();
            membership.setSubforum(subforum);
            membership.setProfile(profile);
            membershipRepository.save(membership);
        }

        return toDto(subforum, profileId);
    }

    @Transactional
    public SubforumDto leave(String slug, Long profileId) {
        Subforum subforum = subforumRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Subforum not found"));

        membershipRepository.findBySubforumIdAndProfileId(subforum.getId(), profileId)
                .ifPresent(membershipRepository::delete);

        return toDto(subforum, profileId);
    }

    private SubforumDto toDto(Subforum s, Long profileId) {
        long memberCount = membershipRepository.countBySubforumId(s.getId());
        boolean joined = profileId != null && membershipRepository.existsBySubforumIdAndProfileId(s.getId(), profileId);
        List<String> rules = s.getRules() == null || s.getRules().isBlank()
                ? List.of()
                : Arrays.stream(s.getRules().split("\n")).map(String::trim).filter(r -> !r.isEmpty()).toList();

        return new SubforumDto(
                s.getId(), s.getSlug(), s.getName(), s.getDescription(),
                s.getCategory() == null ? "General" : s.getCategory(),
                s.getIconEmoji() == null ? "💬" : s.getIconEmoji(),
                s.getBannerImageUrl(), rules, memberCount, joined
        );
    }
}
