package com.neetaspirants.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "subforums")
@Getter
@Setter
@NoArgsConstructor
public class Subforum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column
    private String category = "General";

    @Column
    private String iconEmoji = "💬";

    @Column
    private String bannerImageUrl;

    @Lob
    private String rules;
}
