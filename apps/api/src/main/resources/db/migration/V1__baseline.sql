-- Baseline schema, dumped from the dev database as it existed under
-- Hibernate's ddl-auto=update on 2026-08-25. This lets Flyway both
-- (a) baseline an existing database that already has this schema, and
-- (b) bootstrap a brand new empty database from scratch.
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `anonymous_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `alias` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  `bio` varchar(280) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_active_seconds` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKp8mjfvps6p5gf6pn1mjuimsj5` (`alias`),
  UNIQUE KEY `UKl7eln2m1j10uw4iublh8m3bdh` (`user_id`),
  CONSTRAINT `FKg25x86ox8k92cdt77c5sx26kf` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `body` tinytext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `room_id` bigint NOT NULL,
  `sender_profile_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKhalwepod3944695ji0suwoqb9` (`room_id`),
  KEY `FKmmlklc66kqn9x0ia8mcc8yoi` (`sender_profile_id`),
  CONSTRAINT `FKhalwepod3944695ji0suwoqb9` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`),
  CONSTRAINT `FKmmlklc66kqn9x0ia8mcc8yoi` FOREIGN KEY (`sender_profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `chat_room_members` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `joined_at` datetime(6) NOT NULL,
  `profile_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9866gpejql9wd5o9al13ppl7` (`room_id`,`profile_id`),
  KEY `FKicykjeshq0giq36l2huse6i9h` (`profile_id`),
  CONSTRAINT `FKdvub8k7sypahkamqjaiokb44t` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`),
  CONSTRAINT `FKicykjeshq0giq36l2huse6i9h` FOREIGN KEY (`profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `chat_rooms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `topic` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('DM','GROUP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scheduled_for` datetime(6) DEFAULT NULL,
  `last_activity_at` datetime(6) DEFAULT NULL,
  `dm_requested_by_profile_id` bigint DEFAULT NULL,
  `dm_status` enum('ACCEPTED','PENDING') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `score` int NOT NULL,
  `author_profile_id` bigint NOT NULL,
  `parent_comment_id` bigint DEFAULT NULL,
  `post_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKj7ps1yewc8xl6agc05c7sxb4p` (`author_profile_id`),
  KEY `FK7h839m3lkvhbyv3bcdv7sm4fj` (`parent_comment_id`),
  KEY `FKh4c7lvsc298whoyd4w9ta25cr` (`post_id`),
  CONSTRAINT `FK7h839m3lkvhbyv3bcdv7sm4fj` FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`id`),
  CONSTRAINT `FKh4c7lvsc298whoyd4w9ta25cr` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FKj7ps1yewc8xl6agc05c7sxb4p` FOREIGN KEY (`author_profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `daily_stress_scores` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `avg_score` double NOT NULL,
  `sample_count` int NOT NULL,
  `score_date` date NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `profile_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhyh0j2gmjktv4qvj2903ydr44` (`profile_id`,`score_date`),
  CONSTRAINT `FKqyccoe4333qdv20v5kos45kb8` FOREIGN KEY (`profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `follows` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `followee_profile_id` bigint NOT NULL,
  `follower_profile_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKb2cvn82o2f639ta48y38e8thd` (`follower_profile_id`,`followee_profile_id`),
  KEY `FKdgjxn0ku2e0lo2a9pecauifs9` (`followee_profile_id`),
  CONSTRAINT `FKdgjxn0ku2e0lo2a9pecauifs9` FOREIGN KEY (`followee_profile_id`) REFERENCES `anonymous_profiles` (`id`),
  CONSTRAINT `FKqxfw2dr3wo4603dgat4ut8p5y` FOREIGN KEY (`follower_profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_alias` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `subforum_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('REPLY','UPVOTE','MENTION','FOLLOW','DM_REQUEST','MESSAGE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_profile_id` bigint NOT NULL,
  `chat_room_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjok4gru9dj4xud3mm3k0j2obj` (`recipient_profile_id`),
  CONSTRAINT `FKjok4gru9dj4xud3mm3k0j2obj` FOREIGN KEY (`recipient_profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `score` int NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `author_profile_id` bigint NOT NULL,
  `subforum_id` bigint NOT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKqmmso8qxjpbxwegdtp0l90390` (`slug`),
  KEY `FK3dvpm4ugvxbd9fiq7ywyjt9l8` (`author_profile_id`),
  KEY `FK9oktgbtmpmqy9v5g04v3cw4s9` (`subforum_id`),
  CONSTRAINT `FK3dvpm4ugvxbd9fiq7ywyjt9l8` FOREIGN KEY (`author_profile_id`) REFERENCES `anonymous_profiles` (`id`),
  CONSTRAINT `FK9oktgbtmpmqy9v5g04v3cw4s9` FOREIGN KEY (`subforum_id`) REFERENCES `subforums` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `profile_activity_days` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_date` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `profile_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKgfri9qo6xdfwema55ykcl6au9` (`profile_id`,`activity_date`),
  CONSTRAINT `FK5xsbmrq66fqi80eplkvi3476m` FOREIGN KEY (`profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKo2mlirhldriil2y7krapq4frt` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `detail` text COLLATE utf8mb4_unicode_ci,
  `reason_code` enum('AI_FLAGGED','HARASSMENT','OFF_TOPIC','OTHER','SELF_HARM','SPAM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `resolved_by_user_id` bigint DEFAULT NULL,
  `source` enum('AI_FLAGGED','USER_REPORT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DISMISSED','OPEN','RESOLVED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` bigint NOT NULL,
  `target_type` enum('COMMENT','POST') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reporter_profile_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgs21ubpo5fyajh19siv9t6fmf` (`reporter_profile_id`),
  CONSTRAINT `FKgs21ubpo5fyajh19siv9t6fmf` FOREIGN KEY (`reporter_profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `saved_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `post_id` bigint NOT NULL,
  `profile_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKa3sa7kjcyo3vts9c7molyp8wx` (`profile_id`,`post_id`),
  KEY `FK9poxgdc1595vxdxkyg202x4ge` (`post_id`),
  CONSTRAINT `FK9poxgdc1595vxdxkyg202x4ge` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FKoe4ywee0iosrfhojpndp6e2m0` FOREIGN KEY (`profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `subforum_memberships` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `joined_at` datetime(6) NOT NULL,
  `profile_id` bigint NOT NULL,
  `subforum_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKn7q0snllqkkklqtc5f1vj8jns` (`subforum_id`,`profile_id`),
  KEY `FK6hujmytuimuc691sk72axrrp` (`profile_id`),
  CONSTRAINT `FK6hujmytuimuc691sk72axrrp` FOREIGN KEY (`profile_id`) REFERENCES `anonymous_profiles` (`id`),
  CONSTRAINT `FKapmdfh2l7tt9c0fu48v42mqg` FOREIGN KEY (`subforum_id`) REFERENCES `subforums` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `subforums` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `banner_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon_emoji` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rules` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKel6ctixhhvnvoda1286vm5s71` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `suspended` bit(1) NOT NULL,
  `suspended_at` datetime(6) DEFAULT NULL,
  `suspended_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `votes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `value` int NOT NULL,
  `votable_id` bigint NOT NULL,
  `votable_type` enum('COMMENT','POST') COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKgglhyauyq3ta5bwyndyrwwp93` (`votable_type`,`votable_id`,`profile_id`),
  KEY `FK5novo2f5r6qtj8mqwcpw1bsul` (`profile_id`),
  CONSTRAINT `FK5novo2f5r6qtj8mqwcpw1bsul` FOREIGN KEY (`profile_id`) REFERENCES `anonymous_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
