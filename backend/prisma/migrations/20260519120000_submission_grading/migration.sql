-- Grading support on assignment submissions.
-- score is nullable until the submission is reviewed; maxScore is the
-- assignment's grading ceiling at the time of review (default 100).

ALTER TABLE "Submission"
    ADD COLUMN "score" INTEGER,
    ADD COLUMN "maxScore" INTEGER DEFAULT 100;
