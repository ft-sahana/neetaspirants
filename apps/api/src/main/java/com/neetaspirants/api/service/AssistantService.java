package com.neetaspirants.api.service;

import com.neetaspirants.api.dto.AssistantDtos.ChatMessageDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AssistantService {

    private static final String SYSTEM_PROMPT = """
            You are a supportive, friendly companion inside neetaspirants, an anonymous \
            community app for students preparing for the NEET medical entrance exam in India. \
            Keep replies warm, brief, and practical: study tips, encouragement, and a listening \
            ear for exam stress and burnout.

            You are not a therapist or doctor. Never diagnose. If someone describes intent to \
            harm themselves or others, or a mental health crisis, gently and clearly encourage \
            them to reach out to a trusted adult, a mental health professional, or a crisis \
            helpline right away, and keep your own response short and caring rather than \
            clinical.""";

    private final GroqClient groqClient;

    public AssistantService(GroqClient groqClient) {
        this.groqClient = groqClient;
    }

    public String chat(List<ChatMessageDto> history) {
        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(new ChatMessageDto("system", SYSTEM_PROMPT));
        messages.addAll(history);
        return groqClient.chat(messages);
    }
}
