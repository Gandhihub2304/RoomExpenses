import { PrismaClient } from "@prisma/client";
import { isProd } from "@/config/env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProd ? ["error", "warn"] : ["error", "warn"],
    transactionOptions: {
      // Neon's free-tier compute suspends when idle and can take several
      // seconds to wake on the first query. The Prisma defaults (5s
      // maxWait, 5s timeout) are too tight for that cold start and cause
      // "Transaction not found" errors when the wake-up happens mid
      // transaction. Give both more headroom.
      maxWait: 15000,
      timeout: 20000,
    },
  });

if (!isProd) {
  global.__prisma = prisma;
}
