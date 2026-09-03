create table if not exists published_characters (
  id text primary key,
  user_id text not null,
  name text not null,
  age integer not null,
  voice_id text not null,
  tagline text not null,
  bio text not null,
  greeting text not null,
  personality text not null,
  lore text not null,
  system_prompt text not null,
  tags text not null,
  kind text not null,
  accent text not null,
  portrait text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists published_characters_created_idx
  on published_characters (created_at desc);

create index if not exists published_characters_user_idx
  on published_characters (user_id, created_at desc);
