ALTER TABLE `community_messages` ADD `channel` text DEFAULT 'community' NOT NULL;
CREATE INDEX community_messages_channel_created ON community_messages(campus, channel, created);
