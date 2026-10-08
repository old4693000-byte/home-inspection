ALTER TABLE `issues` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `issues` ADD `changes` text DEFAULT '[]' NOT NULL;
