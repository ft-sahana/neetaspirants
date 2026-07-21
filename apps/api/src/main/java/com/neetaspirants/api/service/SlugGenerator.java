package com.neetaspirants.api.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.function.Predicate;
import java.util.regex.Pattern;

@Component
public class SlugGenerator {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");
    private final SecureRandom random = new SecureRandom();

    public String generateUnique(String title, Predicate<String> existsBySlug) {
        String base = slugify(title);
        String candidate = base;
        int attempt = 0;
        while (existsBySlug.test(candidate)) {
            attempt++;
            candidate = base + "-" + Integer.toString(1000 + random.nextInt(9000));
            if (attempt > 20) {
                throw new IllegalStateException("Could not generate a unique slug");
            }
        }
        return candidate;
    }

    private String slugify(String input) {
        String noWhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(noWhitespace, Normalizer.Form.NFD);
        String slug = NON_LATIN.matcher(normalized).replaceAll("").toLowerCase();
        String trimmed = slug.length() > 80 ? slug.substring(0, 80) : slug;
        return trimmed.isBlank() ? "post" : trimmed;
    }
}
