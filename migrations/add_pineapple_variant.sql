-- Migration: Add pineapple variant to game_variant constraint
-- Date: 2025-10-16
-- Description: Updates the valid_game_variant check constraint to include 'pineapple'

-- Drop the existing constraint
ALTER TABLE manos_guardadas
DROP CONSTRAINT IF EXISTS valid_game_variant;

-- Add the updated constraint with pineapple included
ALTER TABLE manos_guardadas
ADD CONSTRAINT valid_game_variant
CHECK (game_variant IN ('holdem', 'omaha', 'pineapple'));

-- Update the column comment to reflect the new variant
COMMENT ON COLUMN manos_guardadas.game_variant IS 'Poker game variant: holdem, omaha, or pineapple (Crazy Pineapple)';
