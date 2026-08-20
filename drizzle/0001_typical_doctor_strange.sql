CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('image','text','email','campaign','code') NOT NULL,
	`title` varchar(255) NOT NULL,
	`prompt` text NOT NULL,
	`content` text,
	`imageUrl` text,
	`isSaved` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
