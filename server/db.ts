import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, games, keyPositions, openingStudies, userProgress, Game, InsertGame, KeyPosition, InsertKeyPosition, OpeningStudy, InsertOpeningStudy, UserProgress, InsertUserProgress } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// Chess game queries
export async function createGame(game: InsertGame): Promise<Game | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(games).values(game);
  const gameId = (result[0] as any).insertId;
  const created = await db.select().from(games).where(eq(games.id, gameId as number)).limit(1);
  return created.length > 0 ? created[0] : null;
}

export async function getUserGames(userId: number, limit = 50, offset = 0): Promise<Game[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(games).where(eq(games.userId, userId)).orderBy(desc(games.createdAt)).limit(limit).offset(offset);
}

export async function getGameById(gameId: number): Promise<Game | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateGame(gameId: number, updates: Partial<Game>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(games).set(updates).where(eq(games.id, gameId));
}

// Key positions queries
export async function createKeyPosition(position: InsertKeyPosition): Promise<KeyPosition | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(keyPositions).values(position);
  const posId = (result[0] as any).insertId;
  const created = await db.select().from(keyPositions).where(eq(keyPositions.id, posId as number)).limit(1);
  return created.length > 0 ? created[0] : null;
}

export async function getGameKeyPositions(gameId: number): Promise<KeyPosition[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(keyPositions).where(eq(keyPositions.gameId, gameId));
}

// Opening studies queries
export async function getOrCreateOpeningStudy(userId: number, ecoCode: string, openingName: string): Promise<OpeningStudy | null> {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(openingStudies).where(and(eq(openingStudies.userId, userId), eq(openingStudies.ecoCode, ecoCode))).limit(1);
  if (existing.length > 0) return existing[0];
  
  const result = await db.insert(openingStudies).values({ userId, ecoCode, openingName });
  const studyId = (result[0] as any).insertId;
  const created = await db.select().from(openingStudies).where(eq(openingStudies.id, studyId as number)).limit(1);
  return created.length > 0 ? created[0] : null;
}

export async function getUserOpeningStudies(userId: number): Promise<OpeningStudy[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(openingStudies).where(eq(openingStudies.userId, userId)).orderBy(desc(openingStudies.lastStudied));
}

// User progress queries
export async function getOrCreateUserProgress(userId: number): Promise<UserProgress | null> {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  
  const result = await db.insert(userProgress).values({ userId });
  const progressId = (result[0] as any).insertId;
  const created = await db.select().from(userProgress).where(eq(userProgress.id, progressId as number)).limit(1);
  return created.length > 0 ? created[0] : null;
}

export async function updateUserProgress(userId: number, updates: Partial<UserProgress>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(userProgress).set(updates).where(eq(userProgress.userId, userId));
  } else {
    await db.insert(userProgress).values({ userId, ...updates });
  }
}
