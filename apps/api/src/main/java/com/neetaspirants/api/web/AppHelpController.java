package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.AssistantDtos.AssistantChatRequest;
import com.neetaspirants.api.dto.AssistantDtos.AssistantChatResponse;
import com.neetaspirants.api.service.AppHelpService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/help")
public class AppHelpController {

    private final AppHelpService appHelpService;

    public AppHelpController(AppHelpService appHelpService) {
        this.appHelpService = appHelpService;
    }

    @PostMapping("/chat")
    public AssistantChatResponse chat(@Valid @RequestBody AssistantChatRequest request) {
        String reply = appHelpService.chat(request.messages());
        return new AssistantChatResponse(reply);
    }
}
