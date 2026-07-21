package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.Subforum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubforumRepository extends JpaRepository<Subforum, Long> {
    Optional<Subforum> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
