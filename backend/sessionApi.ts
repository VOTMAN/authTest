import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

import { configDotenv } from "dotenv";
configDotenv();

import { db } from "../src/db/index.ts";

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

export async function createSession(
  token: string,
  userId: number
): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  };

  const query = {
    text: "INSERT INTO user_session (id, user_id, expires_at) VALUES ($1, $2, $3)",
    values: [session.id, session.userId, session.expiresAt],
  };

  await db.query(query);
  return session;
}

export async function validateSessionToken(
  token: string
): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const row = await db.query(
    `SELECT 
      user_session.id AS session_id, 
      user_session.user_id, 
      user_session.expires_at, 
      app_user.id AS user_id
    FROM user_session 
    INNER JOIN app_user 
    ON app_user.id = user_session.user_id 
    WHERE user_session.id = ($1)`,
    [sessionId]
  );
  if (row.rowCount === 0) {
    return { session: null, user: null };
  }
  const session: Session = {
    id: row.rows[0].session_id,
    userId: row.rows[0].user_id,
    expiresAt: row.rows[0].expires_at,
  };

  const user: User = {
    id: row.rows[0].user_id,
  };

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.query("DELETE FROM user_session WHERE id = $1", [session.id]);
    return { session: null, user: null };
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db.query("UPDATE user_session SET expires_at = $1 WHERE id = $2", [
      session.expiresAt,
      session.id,
    ]);
  }
  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.query("DELETE FROM user_session WHERE id = $1", [sessionId]);
}

export async function invalidateAllSessions(userId: number): Promise<void> {
  await db.query("DELETE FROM user_session WHERE user_id = $1", [userId]);
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export interface Session {
  id: string;
  userId: number;
  expiresAt: Date;
}

export interface User {
  id: number;
}
