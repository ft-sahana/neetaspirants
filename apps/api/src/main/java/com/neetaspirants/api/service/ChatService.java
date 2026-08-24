package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.*;
import com.neetaspirants.api.dto.ChatDtos.*;
import com.neetaspirants.api.repository.*;
import com.neetaspirants.api.security.InputSanitizer;
import com.neetaspirants.api.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatRoomRepository roomRepository;
    private final ChatRoomMemberRepository memberRepository;
    private final ChatMessageRepository messageRepository;
    private final AnonymousProfileRepository profileRepository;
    private final RoomPresenceService presenceService;
    private final NotificationService notificationService;

    public ChatService(
            ChatRoomRepository roomRepository,
            ChatRoomMemberRepository memberRepository,
            ChatMessageRepository messageRepository,
            AnonymousProfileRepository profileRepository,
            RoomPresenceService presenceService,
            NotificationService notificationService
    ) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.profileRepository = profileRepository;
        this.presenceService = presenceService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDto> listGroupRooms(String sort, String category) {
        List<ChatRoom> rooms = roomRepository.findByType(ChatRoomType.GROUP);

        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("All")) {
            rooms = rooms.stream()
                    .filter(r -> category.equalsIgnoreCase(r.getCategory()))
                    .toList();
        }

        if ("scheduled".equalsIgnoreCase(sort)) {
            Instant now = Instant.now();
            return rooms.stream()
                    .filter(r -> r.getScheduledFor() != null && r.getScheduledFor().isAfter(now))
                    .sorted(Comparator.comparing(ChatRoom::getScheduledFor))
                    .map(this::toDto)
                    .toList();
        }

        if ("trending".equalsIgnoreCase(sort)) {
            Instant since = Instant.now().minus(24, ChronoUnit.HOURS);
            return rooms.stream()
                    .sorted(Comparator.comparingLong(
                            (ChatRoom r) -> messageRepository.countByRoomIdAndCreatedAtAfter(r.getId(), since)
                    ).reversed())
                    .map(this::toDto)
                    .toList();
        }

        if ("active".equalsIgnoreCase(sort)) {
            return rooms.stream()
                    .sorted(Comparator.comparing(this::lastActivityOrCreated).reversed())
                    .map(this::toDto)
                    .toList();
        }

        return rooms.stream()
                .sorted(Comparator.comparing(ChatRoom::getCreatedAt).reversed())
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDto> listRoomsForProfile(Long profileId) {
        return memberRepository.findByProfileId(profileId).stream()
                .map(ChatRoomMember::getRoom)
                .map(room -> toDto(room, profileId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDto> listJoinedGroupRooms(Long profileId) {
        return memberRepository.findByProfileId(profileId).stream()
                .map(ChatRoomMember::getRoom)
                .filter(room -> room.getType() == ChatRoomType.GROUP)
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ChatRoomDto createGroupRoom(Long creatorProfileId, CreateGroupRoomRequest request) {
        ChatRoom room = new ChatRoom();
        room.setType(ChatRoomType.GROUP);
        room.setName(request.name());
        room.setTopic(request.topic());
        room.setCategory(request.category());
        room.setScheduledFor(request.scheduledFor());
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
                return toDto(room, profileId);
            }
        }

        ChatRoom room = new ChatRoom();
        room.setType(ChatRoomType.DM);
        room.setDmStatus(DmStatus.PENDING);
        room.setDmRequestedByProfileId(profileId);
        room = roomRepository.save(room);
        addMember(room, profileId);
        addMember(room, otherProfileId);
        return toDto(room, profileId);
    }

    @Transactional
    public ChatRoomDto acceptDm(Long roomId, Long profileId) {
        ChatRoom room = requirePendingDmForRecipient(roomId, profileId);
        room.setDmStatus(DmStatus.ACCEPTED);
        roomRepository.save(room);
        return toDto(room, profileId);
    }

    @Transactional
    public void declineDm(Long roomId, Long profileId) {
        requirePendingDmForRecipient(roomId, profileId);
        messageRepository.deleteByRoomId(roomId);
        memberRepository.deleteByRoomId(roomId);
        roomRepository.deleteById(roomId);
    }

    private ChatRoom requirePendingDmForRecipient(Long roomId, Long profileId) {
        ChatRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));
        if (room.getType() != ChatRoomType.DM || room.getDmStatus() != DmStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This conversation isn't a pending request");
        }
        requireMembership(roomId, profileId);
        if (profileId.equals(room.getDmRequestedByProfileId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can't accept or decline your own request");
        }
        return room;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getHistory(Long roomId, Long requestingProfileId) {
        requireMembership(roomId, requestingProfileId);
        return messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(this::toDto)
                .toList();
    }

    public PresenceEvent getPresence(Long roomId) {
        return new PresenceEvent(presenceService.onlineAliases(roomId));
    }

    @Transactional(readOnly = true)
    public long unreadMessageCount(Long profileId) {
        return notificationService.unreadMessageCount(profileId);
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

        if (room.getType() == ChatRoomType.DM
                && room.getDmStatus() == DmStatus.PENDING
                && !senderProfileId.equals(room.getDmRequestedByProfileId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Accept this conversation before replying");
        }

        var sender = profileRepository.findById(senderProfileId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Profile not found"));

        ChatMessage message = new ChatMessage();
        message.setRoom(room);
        message.setSenderProfile(sender);
        message.setBody(InputSanitizer.stripHtml(body));
        message = messageRepository.save(message);

        room.setLastActivityAt(message.getCreatedAt());
        roomRepository.save(room);

        if (room.getType() == ChatRoomType.DM) {
            notifyDmRecipient(room, senderProfileId, sender.getAlias(), body);
        }

        return toDto(message);
    }

    private void notifyDmRecipient(ChatRoom room, Long senderProfileId, String senderAlias, String body) {
        Long recipientProfileId = memberRepository.findByRoomId(room.getId()).stream()
                .map(m -> m.getProfile().getId())
                .filter(id -> !id.equals(senderProfileId))
                .findFirst()
                .orElse(null);
        if (recipientProfileId == null) return;

        long messageCount = messageRepository.countByRoomId(room.getId());
        if (messageCount <= 1) {
            notificationService.notifyDmRequest(recipientProfileId, senderProfileId, senderAlias, room.getId());
        } else {
            notificationService.notifyMessage(recipientProfileId, senderProfileId, senderAlias, room.getId(), body);
        }
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
        return toDto(room, null);
    }

    private ChatRoomDto toDto(ChatRoom room, Long viewerProfileId) {
        long memberCount = memberRepository.countByRoomId(room.getId());
        int onlineCount = presenceService.onlineCount(room.getId());
        String otherAlias = null;
        if (room.getType() == ChatRoomType.DM && viewerProfileId != null) {
            otherAlias = memberRepository.findByRoomId(room.getId()).stream()
                    .map(ChatRoomMember::getProfile)
                    .filter(p -> !p.getId().equals(viewerProfileId))
                    .findFirst()
                    .map(AnonymousProfile::getAlias)
                    .orElse(null);
        }
        boolean requestedByViewer = viewerProfileId != null && viewerProfileId.equals(room.getDmRequestedByProfileId());

        var lastMessage = messageRepository.findFirstByRoomIdOrderByCreatedAtDesc(room.getId()).orElse(null);
        String lastMessagePreview = lastMessage != null ? lastMessage.getBody() : null;
        String lastMessageSenderAlias = lastMessage != null ? lastMessage.getSenderProfile().getAlias() : null;

        return new ChatRoomDto(
                room.getId(), room.getType().name(), room.getName(), room.getTopic(), room.getCategory(),
                room.getCreatedAt(), lastActivityOrCreated(room), room.getScheduledFor(),
                memberCount, onlineCount, onlineCount > 0, otherAlias,
                room.getDmStatus() != null ? room.getDmStatus().name() : null, requestedByViewer,
                lastMessagePreview, lastMessageSenderAlias
        );
    }

    private Instant lastActivityOrCreated(ChatRoom room) {
        return room.getLastActivityAt() != null ? room.getLastActivityAt() : room.getCreatedAt();
    }

    private ChatMessageDto toDto(ChatMessage message) {
        return new ChatMessageDto(
                message.getId(), message.getRoom().getId(), message.getSenderProfile().getAlias(),
                message.getBody(), message.getCreatedAt()
        );
    }
}
