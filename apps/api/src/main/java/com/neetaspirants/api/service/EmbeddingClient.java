package com.neetaspirants.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class EmbeddingClient {

    private final RestClient restClient;

    public EmbeddingClient(@Value("${app.embeddings.url}") String embeddingsUrl) {
        // Plain HTTP/1.1 request factory — the JDK HttpClient-based default
        // sends an HTTP/2 upgrade attempt that uvicorn's HTTP/1.1 server
        // rejects, silently dropping the request body.
        this.restClient = RestClient.builder()
                .baseUrl(embeddingsUrl)
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    @SuppressWarnings("unchecked")
    public List<Double> embed(String text) {
        Map<String, Object> response = restClient.post()
                .uri("/embed")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("text", text))
                .retrieve()
                .body(Map.class);

        return (List<Double>) response.get("vector");
    }
}
