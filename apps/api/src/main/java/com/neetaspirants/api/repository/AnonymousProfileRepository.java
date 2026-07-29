package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.AnonymousProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnonymousProfileRepository extends JpaRepository<AnonymousProfile, Long> {
    boolean existsByAlias(String alias);
    Optional<AnonymousProfile> findByUserId(Long userId);
    Optional<AnonymousProfile> findByAlias(String alias);
    List<AnonymousProfile> findTop10ByAliasContainingIgnoreCaseAndIdNot(String alias, Long excludeId);
}
