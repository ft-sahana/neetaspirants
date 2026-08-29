package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.Comment;
import com.neetaspirants.api.domain.Post;
import com.neetaspirants.api.domain.Report;
import com.neetaspirants.api.domain.ReportStatus;
import com.neetaspirants.api.domain.ReportTargetType;
import com.neetaspirants.api.domain.Role;
import com.neetaspirants.api.domain.User;
import com.neetaspirants.api.dto.AdminDtos.AdminReportDto;
import com.neetaspirants.api.dto.AdminDtos.AdminUserDto;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.CommentRepository;
import com.neetaspirants.api.repository.PostRepository;
import com.neetaspirants.api.repository.ReportRepository;
import com.neetaspirants.api.repository.UserRepository;
import com.neetaspirants.api.web.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AdminService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final AnonymousProfileRepository profileRepository;
    private final PostService postService;
    private final CommentService commentService;

    public AdminService(
            ReportRepository reportRepository,
            PostRepository postRepository,
            CommentRepository commentRepository,
            UserRepository userRepository,
            AnonymousProfileRepository profileRepository,
            PostService postService,
            CommentService commentService
    ) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.postService = postService;
        this.commentService = commentService;
    }

    @Transactional(readOnly = true)
    public Page<AdminReportDto> listReports(ReportStatus status, Pageable pageable) {
        Page<Report> page = status != null
                ? reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(this::toReportDto);
    }

    private AdminReportDto toReportDto(Report report) {
        String excerpt = null;
        String authorAlias = null;
        Long authorProfileId = null;
        String subforumSlug = null;

        if (report.getTargetType() == ReportTargetType.POST) {
            Post post = postRepository.findById(report.getTargetId()).orElse(null);
            if (post != null) {
                excerpt = post.getTitle() + " — " + truncate(post.getBody());
                authorAlias = post.getAuthorProfile().getAlias();
                authorProfileId = post.getAuthorProfile().getId();
                subforumSlug = post.getSubforum().getSlug();
            }
        } else {
            Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
            if (comment != null) {
                excerpt = truncate(comment.getBody());
                authorAlias = comment.getAuthorProfile().getAlias();
                authorProfileId = comment.getAuthorProfile().getId();
                subforumSlug = comment.getPost().getSubforum().getSlug();
            }
        }

        String reporterAlias = report.getReporterProfile() != null ? report.getReporterProfile().getAlias() : null;

        return new AdminReportDto(
                report.getId(), report.getTargetType().name(), report.getTargetId(),
                report.getSource().name(), report.getReasonCode().name(), report.getDetail(),
                report.getStatus().name(), report.getCreatedAt(),
                reporterAlias, excerpt, authorAlias, authorProfileId, subforumSlug
        );
    }

    private String truncate(String text) {
        if (text == null) return null;
        return text.length() > 200 ? text.substring(0, 200) + "…" : text;
    }

    @Transactional
    public void dismissReport(Long reportId, Long adminUserId) {
        Report report = getOpenReport(reportId);
        report.setStatus(ReportStatus.DISMISSED);
        report.setResolvedAt(Instant.now());
        report.setResolvedByUserId(adminUserId);
        reportRepository.save(report);
    }

    @Transactional
    public void removeReportedContent(Long reportId, Long adminUserId) {
        Report report = getOpenReport(reportId);

        if (report.getTargetType() == ReportTargetType.POST) {
            postRepository.findById(report.getTargetId()).ifPresent(postService::deletePostAndDependents);
        } else {
            commentRepository.findById(report.getTargetId()).ifPresent(commentService::deleteCommentAndReplies);
        }

        resolveAllOpenReportsForTarget(report.getTargetType(), report.getTargetId(), adminUserId);
    }

    private void resolveAllOpenReportsForTarget(ReportTargetType type, Long targetId, Long adminUserId) {
        List<Report> openReports =
                reportRepository.findByTargetTypeAndTargetIdAndStatus(type, targetId, ReportStatus.OPEN);
        Instant now = Instant.now();
        for (Report r : openReports) {
            r.setStatus(ReportStatus.RESOLVED);
            r.setResolvedAt(now);
            r.setResolvedByUserId(adminUserId);
        }
        reportRepository.saveAll(openReports);
    }

    private Report getOpenReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Report not found"));
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new ApiException(HttpStatus.CONFLICT, "Report already resolved");
        }
        return report;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserDto> listUsers(String query, Pageable pageable) {
        Page<AnonymousProfile> page = (query == null || query.isBlank())
                ? profileRepository.findAll(pageable)
                : profileRepository.findByAliasContainingIgnoreCase(query, pageable);
        return page.map(this::toUserDto);
    }

    private AdminUserDto toUserDto(AnonymousProfile profile) {
        User user = profile.getUser();
        long postCount = postRepository.countByAuthorProfileId(profile.getId());
        return new AdminUserDto(
                user.getId(), profile.getId(), user.getEmail(), profile.getAlias(),
                user.getRole().name(), user.isSuspended(), user.getSuspendedReason(),
                user.getCreatedAt(), postCount
        );
    }

    @Transactional
    public void suspendUser(Long profileId, String reason) {
        User user = requireUserByProfileId(profileId);
        if (user.getRole() == Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot suspend an admin account");
        }
        user.setSuspended(true);
        user.setSuspendedReason(reason);
        user.setSuspendedAt(Instant.now());
        userRepository.save(user);
    }

    @Transactional
    public void unsuspendUser(Long profileId) {
        User user = requireUserByProfileId(profileId);
        user.setSuspended(false);
        user.setSuspendedReason(null);
        user.setSuspendedAt(null);
        userRepository.save(user);
    }

    private User requireUserByProfileId(Long profileId) {
        AnonymousProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return profile.getUser();
    }
}
