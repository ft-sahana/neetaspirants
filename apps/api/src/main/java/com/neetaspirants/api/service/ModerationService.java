package com.neetaspirants.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neetaspirants.api.domain.Report;
import com.neetaspirants.api.domain.ReportReason;
import com.neetaspirants.api.domain.ReportSource;
import com.neetaspirants.api.domain.ReportStatus;
import com.neetaspirants.api.domain.ReportTargetType;
import com.neetaspirants.api.dto.AssistantDtos.ChatMessageDto;
import com.neetaspirants.api.repository.ReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ModerationService {

    private static final Logger log = LoggerFactory.getLogger(ModerationService.class);

    private static final String SYSTEM_PROMPT = """
            You are a content-moderation classifier for neetaspirants, an anonymous peer-support \
            community for NEET medical entrance exam aspirants in India. You will be given a \
            community's name, description, and rules, followed by a post's title and body. Decide \
            whether the post is a reasonable fit for that community — on-topic discussion, exam \
            prep, or general peer support/motivation content — versus content that is clearly \
            irrelevant, spam, promotional/advertising, or otherwise does not belong in this \
            community. Be lenient: only flag content that is clearly off-topic or inappropriate, \
            not merely loosely related.

            Respond with ONLY a compact JSON object and nothing else, no markdown fences: \
            {"relevant": true or false, "reason": "<one short sentence explaining the verdict>"}""";

    private final GroqClient groqClient;
    private final ToxicityClient toxicityClient;
    private final ReportRepository reportRepository;
    private final ObjectMapper objectMapper;

    public ModerationService(
            GroqClient groqClient, ToxicityClient toxicityClient,
            ReportRepository reportRepository, ObjectMapper objectMapper
    ) {
        this.groqClient = groqClient;
        this.toxicityClient = toxicityClient;
        this.reportRepository = reportRepository;
        this.objectMapper = objectMapper;
    }

    @Async
    @Transactional
    public void flagPostIfIrrelevant(
            Long postId, String subforumName, String subforumDescription, String subforumRules,
            String title, String body
    ) {
        try {
            String flagReason = checkToxicity(postId, title, body);
            if (flagReason == null) {
                flagReason = checkRelevance(postId, subforumName, subforumDescription, subforumRules, title, body);
            }

            if (flagReason != null) {
                Report report = new Report();
                report.setTargetType(ReportTargetType.POST);
                report.setTargetId(postId);
                report.setSource(ReportSource.AI_FLAGGED);
                report.setReasonCode(ReportReason.AI_FLAGGED);
                report.setDetail(flagReason);
                report.setStatus(ReportStatus.OPEN);
                reportRepository.save(report);
            }
        } catch (Exception e) {
            // Best-effort: moderation flagging must never affect the post itself.
            log.warn("AI moderation check failed for post {}: {}", postId, e.getMessage());
        }
    }

    /** Fast local classifier trained on toxic-comment/clean-Reddit-text data. Returns a flag reason, or null. */
    private String checkToxicity(Long postId, String title, String body) {
        try {
            ToxicityClient.ToxicityResult result = toxicityClient.check(title + ". " + body);
            if (result.toxic()) {
                return String.format("Flagged as toxic by content classifier (score %.2f).", result.score());
            }
        } catch (Exception e) {
            log.warn("Toxicity check failed for post {}: {}", postId, e.getMessage());
        }
        return null;
    }

    /** Groq LLM judge for topical relevance to the subforum. Returns a flag reason, or null. */
    private String checkRelevance(
            Long postId, String subforumName, String subforumDescription, String subforumRules,
            String title, String body
    ) {
        try {
            String userMessage = "Community: " + subforumName
                    + "\nDescription: " + (subforumDescription == null ? "" : subforumDescription)
                    + "\nRules: " + (subforumRules == null ? "" : subforumRules)
                    + "\n\nPost title: " + title
                    + "\nPost body: " + body;

            String reply = groqClient.chat(List.of(
                    new ChatMessageDto("system", SYSTEM_PROMPT),
                    new ChatMessageDto("user", userMessage)
            ));

            JsonNode json = objectMapper.readTree(extractJson(reply));
            boolean relevant = json.path("relevant").asBoolean(true);
            String reason = json.path("reason").asText("Flagged as off-topic by AI moderation.");
            return relevant ? null : reason;
        } catch (Exception e) {
            log.warn("Relevance check failed for post {}: {}", postId, e.getMessage());
            return null;
        }
    }

    private String extractJson(String reply) {
        int start = reply.indexOf('{');
        int end = reply.lastIndexOf('}');
        if (start == -1 || end == -1 || end < start) {
            return reply;
        }
        return reply.substring(start, end + 1);
    }
}
