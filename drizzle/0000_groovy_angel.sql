CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`mime` text NOT NULL,
	`purpose` text NOT NULL,
	`portal` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` text NOT NULL,
	`room` text NOT NULL,
	`location` text NOT NULL,
	`description` text NOT NULL,
	`plan_id` text,
	`x` integer,
	`y` integer,
	`status` text NOT NULL,
	`rounds` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `issues_request_id_unique` ON `issues` (`request_id`);--> statement-breakpoint
CREATE INDEX `idx_issues_plan` ON `issues` (`plan_id`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
