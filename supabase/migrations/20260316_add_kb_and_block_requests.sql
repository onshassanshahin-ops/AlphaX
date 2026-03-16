-- Safe additive migration for AlphaX (no destructive operations)
-- Created: 2026-03-16

begin;

create extension if not exists "uuid-ossp";

-- Block join requests
create table if not exists block_join_requests (
  id uuid primary key default uuid_generate_v4(),
  alphanaut_id uuid references alphanauts(id) on delete cascade,
  block_slug text references blocks(slug) on delete cascade,
  requested_role text not null default 'member' check (requested_role in ('member', 'navigator')),
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  resolved_role text check (resolved_role in ('member', 'navigator')),
  admin_notes text,
  reviewed_by uuid references admins(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- KB section navigators
create table if not exists kb_section_navigators (
  section text primary key check (section in ('translation', 'simplification')),
  alphanaut_id uuid references alphanauts(id) on delete set null,
  updated_at timestamptz default now()
);

-- KB subgroups
create table if not exists kb_subgroups (
  id uuid primary key default uuid_generate_v4(),
  section text not null check (section in ('translation', 'simplification')),
  name text not null,
  description text,
  leader_id uuid references alphanauts(id) on delete set null,
  created_by uuid references alphanauts(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- KB subgroup members
create table if not exists kb_subgroup_members (
  subgroup_id uuid references kb_subgroups(id) on delete cascade,
  alphanaut_id uuid references alphanauts(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz default now(),
  primary key (subgroup_id, alphanaut_id)
);

-- KB workflows
create table if not exists kb_workflows (
  id uuid primary key default uuid_generate_v4(),
  title_ar text not null,
  title_en text,
  original_authors text,
  description_ar text,
  description_en text,
  field text check (field in ('medical', 'ai', 'stem', 'neuroscience', 'other')),
  source_url text,
  translated_file_url text,
  simplified_file_url text,
  translation_subgroup_id uuid references kb_subgroups(id) on delete set null,
  simplification_subgroup_id uuid references kb_subgroups(id) on delete set null,
  created_by uuid references alphanauts(id) on delete set null,
  translation_navigator_id uuid references alphanauts(id) on delete set null,
  simplification_navigator_id uuid references alphanauts(id) on delete set null,
  paper_id uuid references papers(id) on delete set null,
  status text not null default 'translation_in_progress' check (
    status in (
      'translation_in_progress',
      'translation_review',
      'simplification_in_progress',
      'simplification_review',
      'admin_review',
      'published',
      'changes_requested',
      'rejected'
    )
  ),
  translation_notes text,
  simplification_notes text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- KB subgroup tasks
create table if not exists kb_subgroup_tasks (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid references kb_workflows(id) on delete cascade,
  subgroup_id uuid references kb_subgroups(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references alphanauts(id) on delete set null,
  assigned_by uuid references alphanauts(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  deadline timestamptz,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Indexes (safe additive)
create index if not exists idx_block_join_requests_status on block_join_requests(status, created_at desc);
create index if not exists idx_block_join_requests_alphanaut on block_join_requests(alphanaut_id, created_at desc);
create index if not exists idx_kb_subgroups_section on kb_subgroups(section, created_at desc);
create index if not exists idx_kb_subgroups_leader on kb_subgroups(leader_id);
create index if not exists idx_kb_workflows_status on kb_workflows(status, updated_at desc);
create index if not exists idx_kb_workflows_translation_subgroup on kb_workflows(translation_subgroup_id);
create index if not exists idx_kb_workflows_simplification_subgroup on kb_workflows(simplification_subgroup_id);
create index if not exists idx_kb_tasks_workflow on kb_subgroup_tasks(workflow_id, created_at desc);
create index if not exists idx_kb_tasks_subgroup on kb_subgroup_tasks(subgroup_id, status);
create index if not exists idx_kb_tasks_assigned_to on kb_subgroup_tasks(assigned_to, status);

-- RLS enable (safe if table exists)
alter table block_join_requests enable row level security;
alter table kb_section_navigators enable row level security;
alter table kb_subgroups enable row level security;
alter table kb_subgroup_members enable row level security;
alter table kb_workflows enable row level security;
alter table kb_subgroup_tasks enable row level security;

-- Ensure section rows exist
insert into kb_section_navigators (section, alphanaut_id)
values
  ('translation', null),
  ('simplification', null)
on conflict (section) do nothing;

commit;
