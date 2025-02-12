CREATE TABLE `short_link` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` varchar(255) NOT NULL,
	`short_code` varchar(20) NOT NULL,
	CONSTRAINT `short_link_id` PRIMARY KEY(`id`),
	CONSTRAINT `short_link_short_code_unique` UNIQUE(`short_code`)
);
