/*
  # Add priority column to todos table

  1. Modified Tables
    - `todos`
      - Add `priority` column (text) with values: 'high', 'medium', 'low'
      - Default priority is 'medium'

  2. Notes
    - Priority levels: high (red), medium (orange), low (green)
*/

ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));
