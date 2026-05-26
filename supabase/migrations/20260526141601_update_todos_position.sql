/*
  # Update todos table for drag and drop ordering

  1. Modified Tables
    - `todos`
      - Add `position` column (integer) for custom ordering
      - Update existing records with position values

  2. Notes
    - This enables drag-and-drop reordering of tasks
*/

ALTER TABLE todos ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Update existing records with position based on created_at
UPDATE todos SET position = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM todos
) AS sub
WHERE todos.id = sub.id;
