-- Run this in Supabase SQL Editor
-- Creates a single key-value table for all tracker data

create table if not exists tracker_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Allow public read (for clients)
alter table tracker_data enable row level security;

create policy "Public read" on tracker_data
  for select using (true);

create policy "Public write" on tracker_data
  for all using (true);
