package com.neetaspirants.api.service;

import com.neetaspirants.api.repository.AnonymousProfileRepository;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class AliasGenerator {

    private static final String[] ADJECTIVES = {
            "Silent", "Steady", "Calm", "Focused", "Resilient", "Quiet", "Bright",
            "Patient", "Driven", "Hopeful", "Brave", "Determined", "Gentle", "Fearless"
    };

    private static final String[] NOUNS = {
            "Achiever", "Aspirant", "Scholar", "Dreamer", "Fighter", "Learner",
            "Warrior", "Seeker", "Climber", "Believer", "Voyager", "Owl", "Falcon"
    };

    private final AnonymousProfileRepository profileRepository;
    private final SecureRandom random = new SecureRandom();

    public AliasGenerator(AnonymousProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public String generate() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String candidate = ADJECTIVES[random.nextInt(ADJECTIVES.length)]
                    + NOUNS[random.nextInt(NOUNS.length)]
                    + "_" + (100 + random.nextInt(900));
            if (!profileRepository.existsByAlias(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique alias, please retry");
    }
}
