package com.neetaspirants.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class ToxicityClient {

    private final RestClient restClient;

    public ToxicityClient(@Value("${app.embeddings.url}") String embeddingsUrl) {
        // Plain HTTP/1.1 request factory — see EmbeddingClient for why.
        this.restClient = RestClient.builder()
                .baseUrl(embeddingsUrl)
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    public record ToxicityResult(boolean toxic, double score) {}

    @SuppressWarnings("unchecked")
    public ToxicityResult check(String text) {
        Map<String, Object> response = restClient.post()
                .uri("/moderate/toxicity")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("text", text))
                .retrieve()
                .body(Map.class);

        boolean toxic = Boolean.TRUE.equals(response.get("toxic"));
        double score = ((Number) response.get("score")).doubleValue();
        return new ToxicityResult(toxic, score);
    }
}
