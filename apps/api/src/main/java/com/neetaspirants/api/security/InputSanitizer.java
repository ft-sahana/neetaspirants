package com.neetaspirants.api.security;

import java.util.regex.Pattern;

public final class InputSanitizer {

    private static final Pattern HTML_TAG = Pattern.compile("<[^>]*>");

    private InputSanitizer() {}

    public static String stripHtml(String input) {
        if (input == null) return null;
        return HTML_TAG.matcher(input).replaceAll("").trim();
    }
}
