import fs from "fs/promises";
import path from "path";
import { Language } from "./i18n.js";

// The filter structure for defining multiple buying rules.
export interface GiftFilter {
  min_price: number;
  max_price: number;
  max_repeats: number;
  purchased_count: number;
}

// The main structure for a user's data in the database.
export interface User {
  language: Language;
  subscription_active: boolean;
  subscription_expires_at: string | null;
  balance: number;
  channel_id: string | null;
  channel_access_hash: string | null; // <-- NEW: To store the channel's access hash
  filters: GiftFilter[];
}

// Defines the structure of the entire database file.
interface Database {
  users: Record<string, User>;
}

const dbPath = path.join(process.cwd(), "db.json");

const initialData: Database = {
  users: {},
};

/**
 * Reads the entire database file, ensuring it exists and is valid.
 * @returns A Promise that resolves to the database content.
 */
export async function readDb(): Promise<Database> {
  try {
    const data = await fs.readFile(dbPath, "utf-8");
    if (!data) {
        await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    const parsedData = JSON.parse(data);
    if (!parsedData.users) {
        return initialData;
    }
    return parsedData;
  } catch (error) {
    await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

/**
 * Writes the given data object to the database file.
 * @param data The entire database object to be saved.
 */
export async function writeDb(data: Database): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

/**
 * Retrieves the data for a specific user.
 * @param userId The Telegram ID of the user.
 * @returns A Promise that resolves to the user's data, or null if not found.
 */
export async function getUser(userId: string): Promise<User | null> {
  const db = await readDb();
  return db.users[userId] || null;
}

/**
 * Creates a new user or updates an existing one's data.
 * @param userId The Telegram ID of the user to update.
 * @param userData An object containing the new data to be merged.
 * @returns A Promise that resolves to the fully updated user object.
 */
export async function updateUser(userId: string, userData: Partial<User>): Promise<User> {
  const db = await readDb();
  
  const existingUser = db.users[userId] || {
    language: 'en',
    subscription_active: false,
    subscription_expires_at: null,
    balance: 0,
    channel_id: null,
    channel_access_hash: null, // <-- NEW: Default value for the new field
    filters: [],
  };

  db.users[userId] = { ...existingUser, ...userData };
  await writeDb(db);
  return db.users[userId];
}