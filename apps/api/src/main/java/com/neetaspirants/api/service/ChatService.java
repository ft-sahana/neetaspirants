package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.*;
import com.neetaspirants.api.dto.ChatDtos.*;
import com.neetaspirants.api.repository.*;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatRoomRepository roomRepository;
    private final ChatRoomMemberRepository memberRepository;
    private final ChatMessageRepository messageRepository;
    private final AnonymousProfileRepository profileRepository;

    public ChatService(
            ChatRoomRepository roomRepository,
            ChatRoomMemberRepository memberRepository,
            ChatMessageRepository messageRepository,
            AnonymousProfileRepository profileRepository
    ) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDto> listGroupRooms() {
        return roomRepository.findByType(ChatRoomType.GROUP).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDto> listRoomsForProfile(Long profileId) {
        return memberRepository.findByProfileId(profileId).stream()
                .map(ChatRoomMember::getRoom)
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ChatRoomDto createGroupRoom(Long creatorProfileId, CreateGroupRoomRequest request) {
        ChatRoom room = new ChatRoom();
        room.setType(ChatRoomType.GROUP);
        room.setName(request.name());
        room.setTopic(request.topic());
        room = roomRepository.save(room);
        addMember(room, creatorProfileId);
        return toDto(room);
    }

    @Transactional
    public ChatRoomDto joinGroupRoom(Long roomId, Long profileId) {
        ChatRoom room = requireGroupRoom(roomId);
        addMember(room, profileId);
        return toDto(room);
    }

    @Transactional
    public ChatRoomDto getOrCreateDm(Long profileId, Long otherProfileId) {
        if (profileId.equals(otherProfileId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot start a DM with yourself");
        }

        Set<Long> myRoomIds = memberRepository.findByProfileId(profileId).stream()
                .map(m -> m.getRoom().getId()).collect(Collectors.toSet());
        Set<Long> theirRoomIds = memberRepository.findByProfileId(otherProfileId).stream()
                .map(m -> m.getRoom().getId()).collect(Collectors.toSet());

        myRoomIds.retainAll(theirRoomIds);
        for (Long roomId : myRoomIds) {
            ChatRoom room = roomRepository.findById(roomId).orElseThrow();
            if (room.getType() == ChatRoomType.DM) {
                return toDto(room);
            }
        }

        ChatRoom room = new ChatRoom();
        room.setType(ChatRoomType.DM);
        room = roomRepository.save(room);
        addMember(room, profileId);
        addMember(room, otherProfileId);
        return toDto(room);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getHistory(Long roomId, Long requestingProfileId) {
        requireMembership(roomId, requestingProfileId);
        return messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ChatMessageDto sendMessage(Long roomId, Long senderProfileId, String body) {
        ChatRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));

        boolean isMember = memberRepository.existsByRoomIdAndProfileId(roomId, senderProfileId);
        if (!isMember) {
            if (room.getType() == ChatRoomType.GROUP) {
                addMember(room, senderProfileId);
            } else {
                throw new ApiException(HttpStatus.FORBIDDEN, "You are not a member of this conversation");
            }
        }

        var sender = profileRepository.findById(senderProfileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        ChatMessage message = new ChatMessage();
        message.setRoom(room);
        message.setSenderProfile(sender);
        message.setBody(body);
        message = messageRepository.save(message);

        return toDto(message);
    }

    private void requireMembership(Long roomId, Long profileId) {
        if (!memberRepository.existsByRoomIdAndProfileId(roomId, profileId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a member of this conversation");
        }
    }

    private ChatRoom requireGroupRoom(Long roomId) {
        ChatRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));
        if (room.getType() != ChatRoomType.GROUP) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Not a group room");
        }
        return room;
    }

    private void addMember(ChatRoom room, Long profileId) {
        if (memberRepository.existsByRoomIdAndProfileId(room.getId(), profileId)) return;
        var profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));
        ChatRoomMember member = new ChatRoomMember();
        member.setRoom(room);
        member.setProfile(profile);
        memberRepository.save(member);
    }

    private ChatRoomDto toDto(ChatRoom room) {
        return new ChatRoomDto(room.getId(), room.getType().name(), room.getName(), room.getTopic(), room.getCreatedAt());
    }

    private ChatMessageDto toDto(ChatMessage message) {
        return new ChatMessageDto(
                message.getId(), message.getRoom().getId(), message.getSenderProfile().getAlias(),
                message.getBody(), message.getCreatedAt()
        );
    }
}
