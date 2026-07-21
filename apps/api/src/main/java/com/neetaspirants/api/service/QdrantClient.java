package com.neetaspirants.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class QdrantClient {

    private static final int VECTOR_SIZE = 384;

    private final RestClient restClient;
    private final String collection;

    public QdrantClient(
            @Value("${app.qdrant.url}") String qdrantUrl,
            @Value("${app.qdrant.collection}") String collection
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(qdrantUrl)
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
        this.collection = collection;
    }

    public void ensureCollection() {
        try {
            restClient.put()
                    .uri("/collections/{collection}", collection)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("vectors", Map.of("size", VECTOR_SIZE, "distance", "Cosine")))
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException e) {
            // collection likely already exists; safe to ignore for this MVP
        }
    }

    public void upsertPoint(long id, List<Double> vector, Map<String, Object> payload) {
        restClient.put()
                .uri("/collections/{collection}/points", collection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("points", List.of(Map.of("id", id, "vector", vector, "payload", payload))))
                .retrieve()
                .toBodilessEntity();
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> search(List<Double> vector, int limit) {
        Map<String, Object> response = restClient.post()
                .uri("/collections/{collection}/points/search", collection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("vector", vector, "limit", limit, "with_payload", true))
                .retrieve()
                .body(Map.class);

        Object result = response.get("result");
        return result instanceof List ? (List<Map<String, Object>>) result : List.of();
    }
}
