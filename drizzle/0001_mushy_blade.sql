CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pgn` text NOT NULL,
	`title` varchar(255),
	`opening` varchar(255),
	`openingEco` varchar(10),
	`result` enum('1-0','0-1','1/2-1/2','*') DEFAULT '*',
	`whitePlayer` varchar(255),
	`blackPlayer` varchar(255),
	`isHistorical` boolean DEFAULT false,
	`sourceApi` varchar(50),
	`sourceUrl` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keyPositions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`moveNumber` int NOT NULL,
	`fen` varchar(255) NOT NULL,
	`annotation` text,
	`strategicTheme` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keyPositions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `openingStudies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ecoCode` varchar(10) NOT NULL,
	`openingName` varchar(255) NOT NULL,
	`notes` text,
	`gamesStudied` int DEFAULT 0,
	`lastStudied` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `openingStudies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalGamesAnalyzed` int DEFAULT 0,
	`totalOpeningsStudied` int DEFAULT 0,
	`keyPositionsMarked` int DEFAULT 0,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keyPositions` ADD CONSTRAINT `keyPositions_gameId_games_id_fk` FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `openingStudies` ADD CONSTRAINT `openingStudies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userProgress` ADD CONSTRAINT `userProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;