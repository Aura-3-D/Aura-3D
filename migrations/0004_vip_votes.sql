create table if not exists user_vip (
  user_id text primary key,
  tier text not null default 'free',
  multiplier integer not null default 1,
  is_vip boolean not null default false,
  owner boolean not null default false,
  vip_expires_at timestamptz
);

create table if not exists access_codes (
  code text primary key,
  tier text not null,
  multiplier integer not null,
  duration_days integer not null,
  is_redeemed boolean not null default false,
  redeemed_by text,
  redeemed_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists access_codes_creator_idx
  on access_codes (created_by, created_at desc);

create table if not exists card_votes (
  card_id text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

alter table published_characters
  add column if not exists upvotes integer not null default 0;

create index if not exists published_characters_upvotes_idx
  on published_characters (upvotes desc, created_at desc);

create table if not exists app_meta (
  key text primary key,
  value text not null
);
