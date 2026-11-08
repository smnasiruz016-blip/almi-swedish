-- RR-399 A1: attempts never saved. "SwedishAttempt"."itemId" was a required foreign key to "SwedishItem", a table this product never
-- fills (items are served from the JSON bundles), so every attempt insert failed. Drop only that key; "itemId" stays a required
-- text column with its index ("SwedishAttempt_itemId_idx"). No data changes. IF EXISTS: safe if the key is already gone.
ALTER TABLE "SwedishAttempt" DROP CONSTRAINT IF EXISTS "SwedishAttempt_itemId_fkey";
