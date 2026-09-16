-- Migration: Add banner_url column to characters table
-- Date: 2026-08-26

ALTER TABLE "characters" ADD COLUMN "banner_url" text;
