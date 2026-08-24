package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.Report;
import com.neetaspirants.api.domain.ReportReason;
import com.neetaspirants.api.domain.ReportSource;
import com.neetaspirants.api.domain.ReportStatus;
import com.neetaspirants.api.domain.ReportTargetType;
import com.neetaspirants.api.dto.ReportDtos.CreateReportRequest;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.CommentRepository;
import com.neetaspirants.api.repository.PostRepository;
import com.neetaspirants.api.repository.ReportRepository;
import com.neetaspirants.api.security.InputSanitizer;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final AnonymousProfileRepository profileRepository;

    public ReportService(
            ReportRepository reportRepository,
            PostRepository postRepository,
            CommentRepository commentRepository,
            AnonymousProfileRepository profileRepository
    ) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public void reportPost(Long postId, Long reporterProfileId, CreateReportRequest request) {
        if (!postRepository.existsById(postId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Post not found");
        }
        createReport(ReportTargetType.POST, postId, reporterProfileId, request);
    }

    @Transactional
    public void reportComment(Long commentId, Long reporterProfileId, CreateReportRequest request) {
        if (!commentRepository.existsById(commentId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Comment not found");
        }
        createReport(ReportTargetType.COMMENT, commentId, reporterProfileId, request);
    }

    private void createReport(
            ReportTargetType targetType, Long targetId, Long reporterProfileId, CreateReportRequest request
    ) {
        if (request.reasonCode() == ReportReason.AI_FLAGGED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid report reason");
        }
        if (reportRepository.existsByReporterProfileIdAndTargetTypeAndTargetIdAndStatus(
                reporterProfileId, targetType, targetId, ReportStatus.OPEN)) {
            throw new ApiException(HttpStatus.CONFLICT, "You've already reported this");
        }

        AnonymousProfile reporter = profileRepository.findById(reporterProfileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        Report report = new Report();
        report.setTargetType(targetType);
        report.setTargetId(targetId);
        report.setSource(ReportSource.USER_REPORT);
        report.setReasonCode(request.reasonCode());
        report.setDetail(InputSanitizer.stripHtml(request.detail()));
        report.setStatus(ReportStatus.OPEN);
        report.setReporterProfile(reporter);
        reportRepository.save(report);
    }
}
