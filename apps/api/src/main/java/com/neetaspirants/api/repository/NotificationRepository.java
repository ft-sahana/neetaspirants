package com.neetaspirants.api.repository;

import com.neetaspirants.api.domain.Notification;
import com.neetaspirants.api.domain.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByRecipientProfileIdOrderByCreatedAtDesc(Long recipientProfileId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientProfile.id = :profileId " +
            "AND (n.read = false OR n.read IS NULL)")
    long countUnread(@Param("profileId") Long profileId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientProfile.id = :profileId " +
            "AND n.type IN :types AND (n.read = false OR n.read IS NULL)")
    long countUnreadByTypes(@Param("profileId") Long profileId, @Param("types") Collection<NotificationType> types);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientProfile.id = :profileId " +
            "AND (n.read = false OR n.read IS NULL)")
    int markAllRead(@Param("profileId") Long profileId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.recipientProfile.id = :profileId")
    int markRead(@Param("id") Long id, @Param("profileId") Long profileId);
}
