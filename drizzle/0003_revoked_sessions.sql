CREATE TABLE `revokedSessions` (
	`id` varchar(36) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `revokedSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `revokedSessions_expiry` ON `revokedSessions` (`expiresAt`);