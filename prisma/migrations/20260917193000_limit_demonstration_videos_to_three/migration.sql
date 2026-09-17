DELETE FROM "DemonstrationVideo"
WHERE "position" > 3;

ALTER TABLE "DemonstrationVideo"
DROP CONSTRAINT "DemonstrationVideo_position_check";

ALTER TABLE "DemonstrationVideo"
ADD CONSTRAINT "DemonstrationVideo_position_check"
CHECK ("position" BETWEEN 1 AND 3);
