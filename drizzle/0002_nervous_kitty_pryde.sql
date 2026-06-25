CREATE TABLE `endgameAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`pgn` text,
	`result` enum('win','loss','draw','incomplete') DEFAULT 'incomplete',
	`movesPlayed` int DEFAULT 0,
	`score` int DEFAULT 0,
	`analysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `endgameAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endgameChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endgamePositionId` int NOT NULL,
	`attempts` int DEFAULT 0,
	`bestScore` int DEFAULT 0,
	`solved` boolean DEFAULT false,
	`solvedAt` timestamp,
	`lastAttemptAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `endgameChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endgamePositions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fen` varchar(255) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
	`endgameType` varchar(100) NOT NULL,
	`sideToMove` enum('white','black') DEFAULT 'white',
	`objective` text,
	`keyThemes` text,
	`historicalContext` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `endgamePositions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `endgameAttempts` ADD CONSTRAINT `endgameAttempts_challengeId_endgameChallenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `endgameChallenges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endgameChallenges` ADD CONSTRAINT `endgameChallenges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endgameChallenges` ADD CONSTRAINT `endgameChallenges_endgamePositionId_endgamePositions_id_fk` FOREIGN KEY (`endgamePositionId`) REFERENCES `endgamePositions`(`id`) ON DELETE no action ON UPDATE no action;