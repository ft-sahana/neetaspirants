package com.neetaspirants.api.ws;

import com.neetaspirants.api.dto.ChatDtos.PresenceEvent;
import com.neetaspirants.api.service.RoomPresenceService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RoomPresenceListener {

    private static final Pattern ROOM_TOPIC = Pattern.compile("^/topic/room/(\\d+)$");

    private final RoomPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    public RoomPresenceListener(RoomPresenceService presenceService, SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        if (destination == null) return;

        Matcher matcher = ROOM_TOPIC.matcher(destination);
        if (!matcher.matches()) return;

        if (!(accessor.getUser() instanceof StompPrincipal principal)) return;

        Long roomId = Long.valueOf(matcher.group(1));
        presenceService.subscribe(accessor.getSessionId(), accessor.getSubscriptionId(), roomId, principal.profileId(), principal.alias());
        broadcast(roomId);
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Long roomId = presenceService.unsubscribe(accessor.getSessionId(), accessor.getSubscriptionId());
        if (roomId != null) broadcast(roomId);
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Set<Long> affectedRooms = presenceService.disconnect(accessor.getSessionId());
        affectedRooms.forEach(this::broadcast);
    }

    private void broadcast(Long roomId) {
        messagingTemplate.convertAndSend(
                "/topic/room/" + roomId + "/presence",
                new PresenceEvent(presenceService.onlineAliases(roomId))
        );
    }
}
