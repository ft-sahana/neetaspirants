package com.neetaspirants.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class AssistantDtos {

    public record ChatMessageDto(@NotBlank String role, @NotBlank String content) {}

    public record AssistantChatRequest(@NotEmpty List<ChatMessageDto> messages) {}

    public record AssistantChatResponse(String reply) {}
}
