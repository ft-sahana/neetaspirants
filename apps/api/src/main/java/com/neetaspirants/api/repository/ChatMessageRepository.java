package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId);
    long countByRoomIdAndCreatedAtAfter(Long roomId, Instant after);
}
