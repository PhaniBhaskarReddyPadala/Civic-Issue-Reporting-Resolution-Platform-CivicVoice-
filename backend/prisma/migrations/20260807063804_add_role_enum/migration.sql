-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'OFFICER');

-- AlterTable: safely cast existing text values to the new enum
-- USING converts 'CITIZEN' → 'CITIZEN'::Role and 'OFFICER' → 'OFFICER'::Role
-- No data is lost — only values already matching the enum are valid.
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
