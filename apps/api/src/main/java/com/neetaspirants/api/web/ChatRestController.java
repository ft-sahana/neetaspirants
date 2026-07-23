package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ChatDtos.*;
import com.neetaspirants.api.security.AuthenticatedProfile;
import com.neetaspirants.api.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatRestController {

    private final ChatService chatService;

    public ChatRestController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/rooms")
    public List<ChatRoomDto> myRooms(@AuthenticationPrincipal AuthenticatedProfile principal) {
        return chatService.listRoomsForProfile(principal.profileId());
    }

    @GetMapping("/rooms/discover")
    public List<ChatRoomDto> discoverGroupRooms(
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String category
    ) {
        return chatService.listGroupRooms(sort, category);
    }

    @PostMapping("/rooms/group")
    public ChatRoomDto createGroupRoom(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @Valid @RequestBody CreateGroupRoomRequest request
    ) {
        return chatService.createGroupRoom(principal.profileId(), request);
    }

    @PostMapping("/rooms/group/{roomId}/join")
    public ChatRoomDto joinGroupRoom(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @PathVariable Long roomId
    ) {
        return chatService.joinGroupRoom(roomId, principal.profileId());
    }

    @PostMapping("/rooms/dm")
    public ChatRoomDto getOrCreateDm(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @Valid @RequestBody CreateDmRequest request
    ) {
        return chatService.getOrCreateDm(principal.profileId(), request.otherProfileId());
    }

    @GetMapping("/rooms/{roomId}/messages")
    public List<ChatMessageDto> history(
            @AuthenticationPrincipal AuthenticatedProfile principal,
            @PathVariable Long roomId
    ) {
        return chatService.getHistory(roomId, principal.profileId());
    }

    @GetMapping("/rooms/{roomId}/presence")
    public PresenceEvent presence(@PathVariable Long roomId) {
        return chatService.getPresence(roomId);
    }
}
