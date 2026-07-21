package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "room_id")
    private ChatRoom room;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_profile_id")
    private AnonymousProfile senderProfile;

    @Lob
    @Column(nullable = false)
    private String body;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
