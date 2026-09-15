-- Handle IDs are graph presentation data for a relationship. They preserve
-- the side of each object card used to create the connection.
alter table public.relationships
  add column if not exists source_handle text,
  add column if not exists target_handle text;
