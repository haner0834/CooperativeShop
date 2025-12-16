CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "public"."Shop"
ADD COLUMN IF NOT EXISTS "requestHashId" TEXT;

UPDATE "public"."Shop"
SET "requestHashId" = gen_random_uuid()
WHERE "requestHashId" IS NULL;

ALTER TABLE "public"."Shop"
ALTER COLUMN "requestHashId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Shop_requestHashId_key"
ON "public"."Shop"("requestHashId");
