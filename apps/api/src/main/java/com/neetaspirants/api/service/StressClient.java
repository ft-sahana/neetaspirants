package com.neetaspirants.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class StressClient {

    private final RestClient restClient;

    public StressClient(@Value("${app.embeddings.url}") String embeddingsUrl) {
        // Plain HTTP/1.1 request factory — see EmbeddingClient for why.
        this.restClient = RestClient.builder()
                .baseUrl(embeddingsUrl)
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    public record StressResult(boolean stressed, double score) {}

    @SuppressWarnings("unchecked")
    public StressResult check(String text) {
        Map<String, Object> response = restClient.post()
                .uri("/analyze/stress")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("text", text))
                .retrieve()
                .body(Map.class);

        boolean stressed = Boolean.TRUE.equals(response.get("stressed"));
        double score = ((Number) response.get("score")).doubleValue();
        return new StressResult(stressed, score);
    }
}
