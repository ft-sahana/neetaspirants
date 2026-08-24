package com.neetaspirants.api.service;

import com.neetaspirants.api.domain.AnonymousProfile;
import com.neetaspirants.api.domain.Notification;
import com.neetaspirants.api.domain.NotificationType;
import com.neetaspirants.api.dto.NotificationDtos.NotificationDto;
import com.neetaspirants.api.repository.AnonymousProfileRepository;
import com.neetaspirants.api.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private static final int MAX_PREVIEW_LENGTH = 160;

    private final NotificationRepository notificationRepository;
    private final AnonymousProfileRepository profileRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            AnonymousProfileRepository profileRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public void notifyReply(
            Long recipientProfileId, Long actorProfileId, String actorAlias,
            String postSlug, String subforumSlug, String preview
    ) {
        create(recipientProfileId, actorProfileId, NotificationType.REPLY, actorAlias,
                actorAlias + " replied to you: " + truncate(preview), postSlug, subforumSlug, null);
    }

    @Transactional
    public void notifyUpvote(
            Long recipientProfileId, Long actorProfileId, String actorAlias, String targetKind,
            String postSlug, String subforumSlug
    ) {
        create(recipientProfileId, actorProfileId, NotificationType.UPVOTE, actorAlias,
                actorAlias + " upvoted your " + targetKind, postSlug, subforumSlug, null);
    }

    @Transactional
    public void notifyMention(
            Long recipientProfileId, Long actorProfileId, String actorAlias,
            String postSlug, String subforumSlug, String preview
    ) {
        create(recipientProfileId, actorProfileId, NotificationType.MENTION, actorAlias,
                actorAlias + " mentioned you: " + truncate(preview), postSlug, subforumSlug, null);
    }

    @Transactional
    public void notifyFollow(Long recipientProfileId, Long actorProfileId, String actorAlias) {
        create(recipientProfileId, actorProfileId, NotificationType.FOLLOW, actorAlias,
                actorAlias + " started following you", null, null, null);
    }

    @Transactional
    public void notifyDmRequest(Long recipientProfileId, Long actorProfileId, String actorAlias, Long chatRoomId) {
        create(recipientProfileId, actorProfileId, NotificationType.DM_REQUEST, actorAlias,
                actorAlias + " wants to message you", null, null, chatRoomId);
    }

    @Transactional
    public void notifyMessage(Long recipientProfileId, Long actorProfileId, String actorAlias, Long chatRoomId, String preview) {
        create(recipientProfileId, actorProfileId, NotificationType.MESSAGE, actorAlias,
                actorAlias + ": " + truncate(preview), null, null, chatRoomId);
    }

    private void create(
            Long recipientProfileId, Long actorProfileId, NotificationType type, String actorAlias,
            String message, String postSlug, String subforumSlug, Long chatRoomId
    ) {
        // Never notify yourself (e.g. upvoting or replying to your own content).
        if (recipientProfileId == null || recipientProfileId.equals(actorProfileId)) {
            return;
        }
        AnonymousProfile recipient = profileRepository.findById(recipientProfileId).orElse(null);
        if (recipient == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setRecipientProfile(recipient);
        notification.setType(type);
        notification.setActorAlias(actorAlias);
        notification.setMessage(message);
        notification.setPostSlug(postSlug);
        notification.setSubforumSlug(subforumSlug);
        notification.setChatRoomId(chatRoomId);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> listForProfile(Long profileId) {
        return notificationRepository.findTop50ByRecipientProfileIdOrderByCreatedAtDesc(profileId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long profileId) {
        return notificationRepository.countUnread(profileId);
    }

    @Transactional(readOnly = true)
    public long unreadMessageCount(Long profileId) {
        return notificationRepository.countUnreadByTypes(
                profileId, List.of(NotificationType.DM_REQUEST, NotificationType.MESSAGE)
        );
    }

    @Transactional
    public void markAllRead(Long profileId) {
        notificationRepository.markAllRead(profileId);
    }

    @Transactional
    public void markRead(Long profileId, Long notificationId) {
        notificationRepository.markRead(notificationId, profileId);
    }

    private String truncate(String text) {
        if (text == null) return "";
        String trimmed = text.trim();
        return trimmed.length() > MAX_PREVIEW_LENGTH
                ? trimmed.substring(0, MAX_PREVIEW_LENGTH) + "…"
                : trimmed;
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(), n.getType().name(), n.getActorAlias(), n.getMessage(),
                n.getPostSlug(), n.getSubforumSlug(), n.getChatRoomId(), Boolean.TRUE.equals(n.getRead()), n.getCreatedAt()
        );
    }
}
