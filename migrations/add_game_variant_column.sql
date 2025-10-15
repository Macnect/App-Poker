-- Migration: Add game_variant column to manos_guardadas table
-- Date: 2025-10-15
-- Description: Adds a game_variant column to support different poker variants (Hold'em, Omaha, etc.)

-- Add the game_variant column with a default value of 'holdem' for backward compatibility
ALTER TABLE manos_guardadas
ADD COLUMN IF NOT EXISTS game_variant TEXT NOT NULL DEFAULT 'holdem';

-- Add a check constraint to ensure only valid game variants are stored
ALTER TABLE manos_guardadas
ADD CONSTRAINT valid_game_variant
CHECK (game_variant IN ('holdem', 'omaha'));

-- Create an index on game_variant for faster filtering
CREATE INDEX IF NOT EXISTS idx_manos_guardadas_game_variant
ON manos_guardadas(game_variant);

-- Update existing rows to have 'holdem' as the default variant (if any NULL values exist)
UPDATE manos_guardadas
SET game_variant = 'holdem'
WHERE game_variant IS NULL;

-- Add a comment to the column for documentation
COMMENT ON COLUMN manos_guardadas.game_variant IS 'Poker game variant: holdem or omaha';
