CREATE TABLE `campus_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`account_id` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`account_id` text NOT NULL,
	`event_id` text NOT NULL,
	`response` text NOT NULL,
	`updated` text NOT NULL
);
