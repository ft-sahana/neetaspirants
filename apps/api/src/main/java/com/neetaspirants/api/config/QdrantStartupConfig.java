package com.neetaspirants.api.config;

import com.neetaspirants.api.service.QdrantClient;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QdrantStartupConfig {

    @Bean
    public CommandLineRunner ensureQdrantCollection(QdrantClient qdrantClient) {
        return args -> qdrantClient.ensureCollection();
    }
}
