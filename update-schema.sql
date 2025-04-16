ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS user_id INTEGER;
UPDATE artifacts SET user_id = 1 WHERE user_id IS NULL;
