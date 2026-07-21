package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
        name = "chat_room_members",
        uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "profile_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class ChatRoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "room_id")
    private ChatRoom room;

    @ManyToOne(optional = false)
    @JoinColumn(name = "profile_id")
    private AnonymousProfile profile;

    @Column(nullable = false, updatable = false)
    private Instant joinedAt = Instant.now();
}
