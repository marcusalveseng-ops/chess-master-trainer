import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Chess games and training data
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  pgn: text("pgn").notNull(),
  title: varchar("title", { length: 255 }),
  opening: varchar("opening", { length: 255 }),
  openingEco: varchar("openingEco", { length: 10 }),
  result: mysqlEnum("result", ["1-0", "0-1", "1/2-1/2", "*"]).default("*"),
  whitePlayer: varchar("whitePlayer", { length: 255 }),
  blackPlayer: varchar("blackPlayer", { length: 255 }),
  isHistorical: boolean("isHistorical").default(false),
  sourceApi: varchar("sourceApi", { length: 50 }),
  sourceUrl: text("sourceUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

export const keyPositions = mysqlTable("keyPositions", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull().references(() => games.id, { onDelete: "cascade" }),
  moveNumber: int("moveNumber").notNull(),
  fen: varchar("fen", { length: 255 }).notNull(),
  annotation: text("annotation"),
  strategicTheme: varchar("strategicTheme", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KeyPosition = typeof keyPositions.$inferSelect;
export type InsertKeyPosition = typeof keyPositions.$inferInsert;

export const openingStudies = mysqlTable("openingStudies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  ecoCode: varchar("ecoCode", { length: 10 }).notNull(),
  openingName: varchar("openingName", { length: 255 }).notNull(),
  notes: text("notes"),
  gamesStudied: int("gamesStudied").default(0),
  lastStudied: timestamp("lastStudied"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpeningStudy = typeof openingStudies.$inferSelect;
export type InsertOpeningStudy = typeof openingStudies.$inferInsert;

export const userProgress = mysqlTable("userProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  totalGamesAnalyzed: int("totalGamesAnalyzed").default(0),
  totalOpeningsStudied: int("totalOpeningsStudied").default(0),
  keyPositionsMarked: int("keyPositionsMarked").default(0),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;


// Endgame training module
export const endgamePositions = mysqlTable("endgamePositions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fen: varchar("fen", { length: 255 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  endgameType: varchar("endgameType", { length: 100 }).notNull(), // e.g., "King and Pawn vs King", "Rook Endgame"
  sideToMove: mysqlEnum("sideToMove", ["white", "black"]).default("white"),
  objective: text("objective"), // e.g., "Checkmate in 5 moves", "Achieve a draw"
  keyThemes: text("keyThemes"), // JSON array of themes
  historicalContext: text("historicalContext"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EndgamePosition = typeof endgamePositions.$inferSelect;
export type InsertEndgamePosition = typeof endgamePositions.$inferInsert;

export const endgameChallenges = mysqlTable("endgameChallenges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  endgamePositionId: int("endgamePositionId").notNull().references(() => endgamePositions.id),
  attempts: int("attempts").default(0),
  bestScore: int("bestScore").default(0),
  solved: boolean("solved").default(false),
  solvedAt: timestamp("solvedAt"),
  lastAttemptAt: timestamp("lastAttemptAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EndgameChallenge = typeof endgameChallenges.$inferSelect;
export type InsertEndgameChallenge = typeof endgameChallenges.$inferInsert;

export const endgameAttempts = mysqlTable("endgameAttempts", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull().references(() => endgameChallenges.id, { onDelete: "cascade" }),
  pgn: text("pgn"),
  result: mysqlEnum("result", ["win", "loss", "draw", "incomplete"]).default("incomplete"),
  movesPlayed: int("movesPlayed").default(0),
  score: int("score").default(0),
  analysis: text("analysis"), // JSON with move-by-move analysis
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EndgameAttempt = typeof endgameAttempts.$inferSelect;
export type InsertEndgameAttempt = typeof endgameAttempts.$inferInsert;
