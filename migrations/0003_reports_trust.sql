alter table published_characters
  add column if not exists removed_at timestamptz;

create table if not exists user_trust (
  user_id text primary key,
  score integer not null default 0,
  last_day date not null default current_date,
  publish_frozen boolean not null default false
);

create table if not exists card_reports (
  id text primary key,
  card_id text not null,
  reporter_id text not null,
  reason text not null default 'other',
  verdict text not null default 'pending',
  created_at timestamptz not null default now()
);

create unique index if not exists card_reports_one_idx
  on card_reports (card_id, reporter_id);

create index if not exists card_reports_reporter_idx
  on card_reports (reporter_id, created_at desc);
