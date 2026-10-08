-- CreateEnum
CREATE TYPE "ExpenseFunding" AS ENUM ('PERSONAL', 'ROOM');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "funding" "ExpenseFunding" NOT NULL DEFAULT 'PERSONAL';
