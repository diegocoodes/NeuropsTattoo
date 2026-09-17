CREATE TABLE "DemonstrationVideo" (
  "siteId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DemonstrationVideo_position_check" CHECK ("position" BETWEEN 1 AND 5),
  CONSTRAINT "DemonstrationVideo_pkey" PRIMARY KEY ("siteId", "position")
);

CREATE INDEX "DemonstrationVideo_siteId_idx" ON "DemonstrationVideo"("siteId");

ALTER TABLE "DemonstrationVideo"
ADD CONSTRAINT "DemonstrationVideo_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "SiteDocument"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "DemonstrationVideo" ("siteId", "position", "title", "videoUrl", "createdAt", "updatedAt")
SELECT
  document."id",
  item.ordinality::INTEGER,
  COALESCE(item.value->>'title', ''),
  item.value->>'video',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SiteDocument" AS document
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(document."content" #> '{demonstration,items}') = 'array'
      THEN document."content" #> '{demonstration,items}'
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS item(value, ordinality)
WHERE item.ordinality <= 5
  AND COALESCE(item.value->>'video', '') <> '';
