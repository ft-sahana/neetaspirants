package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.ChatRoom;
import com.neetaspirants.api.domain.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findByType(ChatRoomType type);
}
