/*
  # Create todos table

  1. New Tables
    - `todos`
      - `id` (uuid, primary key)
      - `content` (text, task description)
      - `completed` (boolean, task completion status)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `todos` table
    - Allow public access for this demo (no authentication required)
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- For this demo app without authentication, we allow public read/write
CREATE POLICY "Public read access"
  ON todos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert access"
  ON todos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update access"
  ON todos FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access"
  ON todos FOR DELETE
  TO anon, authenticated
  USING (true);
