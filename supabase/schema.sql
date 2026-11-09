-- UHL Nam Vuong 2026: run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  round_number int not null unique check (round_number in (1,2)),
  title text not null,
  is_open boolean not null default false
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id),
  team_id uuid not null references public.teams(id),
  voter_name text not null check (length(trim(voter_name)) between 2 and 100),
  voter_email text not null,
  normalized_email text generated always as (lower(trim(voter_email))) stored,
  created_at timestamptz not null default now(),
  constraint votes_one_per_email_per_round unique (round_id, normalized_email)
);

insert into public.teams(name,sort_order) values
 ('Đội 01',1),('Đội 02',2),('Đội 03',3),('Đội 04',4),('Đội 05',5)
on conflict (name) do nothing;

insert into public.rounds(round_number,title,is_open) values
 (1,'Bình chọn vòng 1',false),(2,'Bình chọn vòng 2',false)
on conflict (round_number) do nothing;

alter table public.teams enable row level security;
alter table public.rounds enable row level security;
alter table public.votes enable row level security;

drop policy if exists "Public can read active teams" on public.teams;
create policy "Public can read active teams" on public.teams for select to anon, authenticated using (active = true);

drop policy if exists "Public can read rounds" on public.rounds;
create policy "Public can read rounds" on public.rounds for select to anon, authenticated using (true);

-- No direct public read/insert/update/delete policy exists for votes.
-- All voter submissions go through the guarded RPC below.

create or replace function public.is_uhl_admin()
returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() ->> 'email') = 'trankimngan20006@gmail.com', false);
$$;

create or replace function public.submit_vote(
  p_round_number int,
  p_voter_name text,
  p_voter_email text,
  p_team_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_id uuid;
  v_open boolean;
begin
  if p_round_number not in (1,2) then
    return jsonb_build_object('status','invalid_round');
  end if;
  if length(trim(coalesce(p_voter_name,''))) < 2 or length(trim(p_voter_name)) > 100 then
    return jsonb_build_object('status','invalid_name');
  end if;
  if length(trim(coalesce(p_voter_email,''))) > 254
     or trim(p_voter_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    return jsonb_build_object('status','invalid_email');
  end if;
  select id,is_open into v_round_id,v_open from public.rounds where round_number=p_round_number;
  if v_round_id is null or not v_open then
    return jsonb_build_object('status','closed');
  end if;
  if not exists(select 1 from public.teams where id=p_team_id and active=true) then
    return jsonb_build_object('status','invalid_team');
  end if;
  insert into public.votes(round_id,team_id,voter_name,voter_email)
  values(v_round_id,p_team_id,trim(p_voter_name),lower(trim(p_voter_email)));
  return jsonb_build_object('status','success');
exception when unique_violation then
  return jsonb_build_object('status','already_voted');
end;
$$;

create or replace function public.admin_set_round_status(p_round_number int,p_is_open boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_uhl_admin() then
    raise exception 'not_authorized';
  end if;
  update public.rounds set is_open=p_is_open where round_number=p_round_number;
  if not found then raise exception 'round_not_found'; end if;
  return jsonb_build_object('status','success');
end;
$$;

-- Admin-only view for export/dashboard. Base table remains inaccessible to voters.
create or replace view public.admin_votes_export
with (security_invoker = true)
as
select v.voter_name,v.voter_email,v.created_at,r.round_number,t.name as team_name
from public.votes v
join public.rounds r on r.id=v.round_id
join public.teams t on t.id=v.team_id;

grant select on public.teams, public.rounds to anon, authenticated;
grant execute on function public.submit_vote(int,text,text,uuid) to anon, authenticated;
grant execute on function public.admin_set_round_status(int,boolean) to authenticated;
grant execute on function public.is_uhl_admin() to authenticated;

-- Admin-only SELECT policy on votes, required by the security-invoker export view.
drop policy if exists "Admin can read votes" on public.votes;
create policy "Admin can read votes" on public.votes for select to authenticated using (public.is_uhl_admin());

grant select on public.admin_votes_export to authenticated;
