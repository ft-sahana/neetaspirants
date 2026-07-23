package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "chat_rooms")
@Getter
@Setter
@NoArgsConstructor
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoomType type;

    private String name;

    private String topic;

    private String category;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant lastActivityAt = Instant.now();

    private Instant scheduledFor;
}
