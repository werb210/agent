ALTER TABLE maya_voice_sessions
ADD COLUMN qualification_score INT DEFAULT 0,
ADD COLUMN intent TEXT DEFAULT NULL,
ADD COLUMN escalation TEXT DEFAULT NULL;
