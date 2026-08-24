package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.Report;
import com.neetaspirants.api.domain.ReportStatus;
import com.neetaspirants.api.domain.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByReporterProfileIdAndTargetTypeAndTargetIdAndStatus(
            Long reporterProfileId, ReportTargetType targetType, Long targetId, ReportStatus status
    );

    List<Report> findByTargetTypeAndTargetIdAndStatus(
            ReportTargetType targetType, Long targetId, ReportStatus status
    );
}
