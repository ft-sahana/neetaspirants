package com.neetaspirants.api.dto;

import com.neetaspirants.api.domain.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReportDtos {

    public record CreateReportRequest(
            @NotNull ReportReason reasonCode,
            @Size(max = 500) String detail
    ) {}
}
