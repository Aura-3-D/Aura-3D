create table if not exists user_wallet (
  user_id text primary key,
  coins integer not null default 0,
  text_credit integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists user_usage (
  user_id text primary key,
  day date not null default current_date,
  texts integer not null default 0,
  voice_ms integer not null default 0,
  images integer not null default 0
);
