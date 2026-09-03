create table if not exists shopier_orders (
  id text primary key,
  user_id text not null,
  coins integer not null,
  amount text not null,
  currency text not null default '1',
  status text not null default 'pending',
  payment_id text,
  random_nr text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists shopier_orders_user_id_idx on shopier_orders (user_id);
create index if not exists shopier_orders_status_idx on shopier_orders (status);
