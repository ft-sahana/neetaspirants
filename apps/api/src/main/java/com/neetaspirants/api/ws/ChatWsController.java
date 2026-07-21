package com.neetaspirants.api.ws;

import com.neetaspirants.api.dto.ChatDtos.ChatMessageDto;
import com.neetaspirants.api.dto.ChatDtos.SendMessageRequest;
import com.neetaspirants.api.dto.ChatDtos.TypingEvent;
import com.neetaspirants.api.service.ChatService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWsController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWsController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send/{roomId}")
    public void send(
            @DestinationVariable Long roomId,
            @Payload SendMessageRequest request,
            Principal principal
    ) {
        StompPrincipal user = (StompPrincipal) principal;
        ChatMessageDto message = chatService.sendMessage(roomId, user.profileId(), request.body());
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }

    @MessageMapping("/chat.typing/{roomId}")
    public void typing(
            @DestinationVariable Long roomId,
            @Payload TypingEvent event,
            Principal principal
    ) {
        StompPrincipal user = (StompPrincipal) principal;
        messagingTemplate.convertAndSend(
                "/topic/room/" + roomId + "/typing",
                new TypingEvent(user.alias(), event.typing())
        );
    }
}
