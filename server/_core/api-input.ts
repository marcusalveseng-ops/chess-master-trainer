import { z } from "zod";
import { PGN_MAX_BYTES } from "@shared/pgn-limits";

export const pgnText = z.string().min(1).max(PGN_MAX_BYTES).refine(
  value => Buffer.byteLength(value, "utf8") <= PGN_MAX_BYTES,
  "PGN excede o limite de 60 KB.",
);
export const positiveId = z.number().int().positive().max(2_147_483_647);
export const pageSize = z.number().int().min(1).max(100).default(50);
export const pageOffset = z.number().int().min(0).max(100_000).default(0);
