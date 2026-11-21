-- HIME STUDIO: master contacts and private client/master messaging.
alter table public.master_profiles
  add column if not exists contact_phone text,
  add column if not exists contact_telegram text,
  add column if not exists contact_whatsapp text,
  add column if not exists contact_max text;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  master_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, master_id),
  check (client_id <> master_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists conversations_client_updated_idx on public.conversations(client_id, updated_at desc);
create index if not exists conversations_master_updated_idx on public.conversations(master_id, updated_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participants read conversations" on public.conversations;
create policy "Participants read conversations" on public.conversations for select to authenticated
using (auth.uid() = client_id or auth.uid() = master_id);
drop policy if exists "Clients start conversations" on public.conversations;
create policy "Clients start conversations" on public.conversations for insert to authenticated
with check (auth.uid() = client_id);
drop policy if exists "Participants update conversations" on public.conversations;
create policy "Participants update conversations" on public.conversations for update to authenticated
using (auth.uid() = client_id or auth.uid() = master_id)
with check (auth.uid() = client_id or auth.uid() = master_id);

drop policy if exists "Participants read messages" on public.messages;
create policy "Participants read messages" on public.messages for select to authenticated
using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.client_id = auth.uid() or c.master_id = auth.uid())));
drop policy if exists "Participants send messages" on public.messages;
create policy "Participants send messages" on public.messages for insert to authenticated
with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and (c.client_id = auth.uid() or c.master_id = auth.uid())));

grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

-- Enable realtime delivery where the standard Supabase publication is present.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
  end if;
end $$;
