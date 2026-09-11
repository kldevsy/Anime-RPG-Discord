-- Add element and position enums
CREATE TYPE "element_type" AS ENUM ('fire', 'water', 'electric', 'earth', 'wind', 'light', 'dark', 'neutral');
CREATE TYPE "position_type" AS ENUM ('front', 'mid', 'back');

-- Add element and default_position to characters
ALTER TABLE "characters" ADD COLUMN "element" "element_type" NOT NULL DEFAULT 'neutral';
ALTER TABLE "characters" ADD COLUMN "default_position" "position_type" NOT NULL DEFAULT 'mid';

-- Add battle_position to team_members
ALTER TABLE "team_members" ADD COLUMN "battle_position" "position_type" NOT NULL DEFAULT 'mid';
