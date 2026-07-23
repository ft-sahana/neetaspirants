package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.AssistantDtos.AssistantChatRequest;
import com.neetaspirants.api.dto.AssistantDtos.AssistantChatResponse;
import com.neetaspirants.api.service.AssistantService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/chat")
    public AssistantChatResponse chat(@Valid @RequestBody AssistantChatRequest request) {
        String reply = assistantService.chat(request.messages());
        return new AssistantChatResponse(reply);
    }
}
