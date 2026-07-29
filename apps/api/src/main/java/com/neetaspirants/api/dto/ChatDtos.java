package com.neetaspirants.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;

public class ChatDtos {

    public record ChatRoomDto(
            Long id, String type, String name, String topic, String category,
            Instant createdAt, Instant lastActivityAt, Instant scheduledFor,
            long memberCount, int onlineCount, boolean live, String otherAlias
    ) {}

    public record ChatMessageDto(Long id, Long roomId, String senderAlias, String body, Instant createdAt) {}

    public record CreateGroupRoomRequest(@NotBlank String name, String topic, String category, Instant scheduledFor) {}

    public record CreateDmRequest(Long otherProfileId) {}

    public record SendMessageRequest(@NotBlank String body) {}

    public record TypingEvent(String alias, boolean typing) {}

    public record PresenceEvent(List<String> onlineAliases) {}
}
