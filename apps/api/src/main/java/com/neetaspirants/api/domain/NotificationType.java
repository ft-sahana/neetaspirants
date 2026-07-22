package com.neetaspirants.api.domain;

/**
 * Kept general on purpose. REPLY / UPVOTE / MENTION are the only types with a real
 * trigger in the product today. COMMUNITY_INVITE, ROOM_INVITE and ANNOUNCEMENT are
 * intentionally not added here yet because there is no invite or admin/broadcast flow
 * to fire them from — add the constants (and a matching NotificationService.notifyX)
 * when those flows exist; no schema change will be needed since type is a simple
 * @Enumerated(STRING) column.
 */
public enum NotificationType {
    REPLY,
    UPVOTE,
    MENTION
}
