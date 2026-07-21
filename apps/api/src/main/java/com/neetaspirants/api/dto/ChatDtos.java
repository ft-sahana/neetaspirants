package com.neetaspirants.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class ChatDtos {

    public record ChatRoomDto(Long id, String type, String name, String topic, Instant createdAt) {}

    public record ChatMessageDto(Long id, Long roomId, String senderAlias, String body, Instant createdAt) {}

    public record CreateGroupRoomRequest(@NotBlank String name, String topic) {}

    public record CreateDmRequest(Long otherProfileId) {}

    public record SendMessageRequest(@NotBlank String body) {}

    public record TypingEvent(String alias, boolean typing) {}
}
