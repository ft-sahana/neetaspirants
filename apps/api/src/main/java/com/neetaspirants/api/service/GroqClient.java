package com.neetaspirants.api.service;

import com.neetaspirants.api.dto.AssistantDtos.ChatMessageDto;
import com.neetaspirants.api.web.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Component
public class GroqClient {

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GroqClient(
            @Value("${app.groq.api-key}") String apiKey,
            @Value("${app.groq.model}") String model
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .build();
    }

    @SuppressWarnings("unchecked")
    public String chat(List<ChatMessageDto> messages) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI assistant is not configured");
        }

        List<Map<String, String>> payloadMessages = messages.stream()
                .map(m -> Map.of("role", m.role(), "content", m.content()))
                .toList();

        Map<String, Object> response;
        try {
            response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "model", model,
                            "messages", payloadMessages,
                            "max_tokens", 1024,
                            "temperature", 0.7
                    ))
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI assistant is temporarily unavailable");
        }

        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI assistant returned no response");
        }
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }
}
