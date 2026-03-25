import { config } from "dotenv";
import { resolve } from "node:path";

// Overlay .env.local after default .env (matches Next.js precedence for overlapping keys)
config({ path: resolve(process.cwd(), ".env.local"), override: true });
