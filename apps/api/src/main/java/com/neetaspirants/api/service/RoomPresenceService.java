package com.neetaspirants.api.service;

import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomPresenceService {

    private record Presence(Long roomId, Long profileId, String alias) {}

    private final Map<String, Presence> subscriptions = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> sessionSubscriptions = new ConcurrentHashMap<>();
    private final Map<Long, Map<Long, String>> roomOnline = new ConcurrentHashMap<>();

    public void subscribe(String sessionId, String subscriptionId, Long roomId, Long profileId, String alias) {
        String key = key(sessionId, subscriptionId);
        subscriptions.put(key, new Presence(roomId, profileId, alias));
        sessionSubscriptions.computeIfAbsent(sessionId, s -> ConcurrentHashMap.newKeySet()).add(key);
        roomOnline.computeIfAbsent(roomId, r -> new ConcurrentHashMap<>()).put(profileId, alias);
    }

    public Long unsubscribe(String sessionId, String subscriptionId) {
        String key = key(sessionId, subscriptionId);
        Presence presence = subscriptions.remove(key);
        if (presence == null) return null;

        Set<String> keys = sessionSubscriptions.get(sessionId);
        if (keys != null) {
            keys.remove(key);
            if (keys.isEmpty()) sessionSubscriptions.remove(sessionId);
        }
        removeFromRoom(presence);
        return presence.roomId();
    }

    public Set<Long> disconnect(String sessionId) {
        Set<String> keys = sessionSubscriptions.remove(sessionId);
        if (keys == null) return Set.of();

        Set<Long> affectedRooms = new HashSet<>();
        for (String key : keys) {
            Presence presence = subscriptions.remove(key);
            if (presence != null) {
                removeFromRoom(presence);
                affectedRooms.add(presence.roomId());
            }
        }
        return affectedRooms;
    }

    public int onlineCount(Long roomId) {
        Map<Long, String> aliases = roomOnline.get(roomId);
        return aliases == null ? 0 : aliases.size();
    }

    public List<String> onlineAliases(Long roomId) {
        Map<Long, String> aliases = roomOnline.get(roomId);
        return aliases == null ? List.of() : List.copyOf(aliases.values());
    }

    private void removeFromRoom(Presence presence) {
        Map<Long, String> aliases = roomOnline.get(presence.roomId());
        if (aliases == null) return;
        aliases.remove(presence.profileId());
        if (aliases.isEmpty()) roomOnline.remove(presence.roomId());
    }

    private String key(String sessionId, String subscriptionId) {
        return sessionId + "|" + subscriptionId;
    }
}
