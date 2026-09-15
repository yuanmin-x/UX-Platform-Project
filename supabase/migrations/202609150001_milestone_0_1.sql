create extension if not exists "pgcrypto";

create type public.object_type as enum (
  'business_problem',
  'research_question',
  'study',
  'dataset',
  'result',
  'insight',
  'recommendation'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text not null default '',
  initial_business_problem_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  type public.object_type not null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text not null default '',
  status text,
  owner_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false
);

create table public.project_objects (
  project_id uuid not null references public.projects(id) on delete cascade,
  object_id uuid not null references public.objects(id) on delete cascade,
  x double precision not null default 0,
  y double precision not null default 0,
  width double precision,
  height double precision,
  hidden boolean not null default false,
  custom_color text,
  created_at timestamptz not null default now(),
  primary key (project_id, object_id)
);

alter table public.projects
  add constraint projects_initial_business_problem_fkey
  foreign key (initial_business_problem_id) references public.objects(id) on delete set null;

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_object_id uuid not null,
  target_object_id uuid not null,
  label text,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (source_object_id <> target_object_id),
  unique (project_id, source_object_id, target_object_id),
  foreign key (project_id, source_object_id)
    references public.project_objects(project_id, object_id) on delete cascade,
  foreign key (project_id, target_object_id)
    references public.project_objects(project_id, object_id) on delete cascade
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner' check (role in ('owner', 'lead', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_objects_project_id_idx on public.project_objects(project_id);
create index relationships_project_id_idx on public.relationships(project_id);
create index objects_type_idx on public.objects(type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger objects_set_updated_at
before update on public.objects
for each row execute function public.set_updated_at();

create or replace function public.create_project_with_initial_problem(
  project_name text,
  problem_title text,
  project_description text default ''
)
returns uuid
language plpgsql
as $$
declare
  new_project_id uuid;
  new_problem_id uuid;
begin
  insert into public.projects (name, description)
  values (project_name, coalesce(project_description, ''))
  returning id into new_project_id;

  insert into public.objects (type, title, status)
  values ('business_problem', problem_title, 'draft')
  returning id into new_problem_id;

  insert into public.project_objects (project_id, object_id, x, y)
  values (new_project_id, new_problem_id, 80, 160);

  update public.projects
  set initial_business_problem_id = new_problem_id
  where id = new_project_id;

  return new_project_id;
end;
$$;
