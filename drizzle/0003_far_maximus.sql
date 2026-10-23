CREATE TABLE `community_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`campus` text NOT NULL,
	`sender_key` text NOT NULL,
	`sender_name` text NOT NULL,
	`sender_role` text NOT NULL,
	`body` text NOT NULL,
	`anonymous` integer DEFAULT 0 NOT NULL,
	`ticket_id` text,
	`ticket_title` text,
	`created` integer NOT NULL,
	`hidden` integer DEFAULT 0 NOT NULL
);
