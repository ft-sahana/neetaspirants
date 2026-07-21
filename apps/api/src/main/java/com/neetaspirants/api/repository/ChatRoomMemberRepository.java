package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    List<ChatRoomMember> findByProfileId(Long profileId);
    List<ChatRoomMember> findByRoomId(Long roomId);
    Optional<ChatRoomMember> findByRoomIdAndProfileId(Long roomId, Long profileId);
    boolean existsByRoomIdAndProfileId(Long roomId, Long profileId);
}
