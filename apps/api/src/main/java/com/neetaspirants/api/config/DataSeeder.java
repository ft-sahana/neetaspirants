package com.neetaspirants.api.config;

import com.neetaspirants.api.domain.Subforum;
import com.neetaspirants.api.repository.SubforumRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataSeeder {

    private record SeedSubforum(
            String slug, String name, String description, String category, String iconEmoji, String rules
    ) {}

    private static final String DEFAULT_RULES = String.join("\n",
            "Be kind — no judgment, no shaming.",
            "Stay anonymous — don't ask for or share identifying info.",
            "No spam, self-promotion, or unrelated links.",
            "If you're in crisis, please also reach out to a real person or helpline."
    );

    private static final List<SeedSubforum> SUBFORUMS = List.of(
            new SeedSubforum("motivation", "Motivation", "Wins, pep talks, and reminders that you've got this.",
                    "Motivation", "🔥", DEFAULT_RULES),
            new SeedSubforum("study-stress", "Study Stress", "Talk through the pressure of prep without judgment.",
                    "Exam Preparation", "📚", DEFAULT_RULES),
            new SeedSubforum("burnout", "Burnout", "Recognize the signs and recover before it gets worse.",
                    "Mental Health", "🪫", DEFAULT_RULES),
            new SeedSubforum("sleep", "Sleep", "Sleep deprivation, late-night grind, and getting rest right.",
                    "Mental Health", "🌙", DEFAULT_RULES),
            new SeedSubforum("exam-anxiety", "Exam Anxiety", "Pre-exam nerves, panic, and calming strategies.",
                    "Exam Preparation", "🧘", DEFAULT_RULES),
            new SeedSubforum("ask-a-senior", "Ask a Senior", "Questions for aspirants who've been through it already.",
                    "General", "🎓", DEFAULT_RULES),
            new SeedSubforum("counselling-corner", "Counselling Corner", "A space to ask for professional support.",
                    "Mental Health", "💬", DEFAULT_RULES)
    );

    @Bean
    public CommandLineRunner seedSubforums(SubforumRepository subforumRepository) {
        return args -> SUBFORUMS.forEach(seed -> {
            Subforum subforum = subforumRepository.findBySlug(seed.slug()).orElseGet(Subforum::new);
            subforum.setSlug(seed.slug());
            subforum.setName(seed.name());
            subforum.setDescription(seed.description());
            subforum.setCategory(seed.category());
            subforum.setIconEmoji(seed.iconEmoji());
            subforum.setRules(seed.rules());
            subforumRepository.save(subforum);
        });
    }
}
