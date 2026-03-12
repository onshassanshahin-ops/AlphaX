-- AlphaX Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ========== CORE TABLES ==========

-- Alphanauts (members)
create table if not exists alphanauts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  university text,
  field_of_study text,
  access_code text unique not null,
  role text default 'alphanaut' check (role in ('alphanaut', 'navigator', 'co-captain')),
  bio text,
  avatar_url text,
  is_public boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Blocks (teams)
create table if not exists blocks (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  color text,
  navigator_id uuid references alphanauts(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Alphanaut block memberships + permissions
create table if not exists alphanaut_blocks (
  id uuid primary key default uuid_generate_v4(),
  alphanaut_id uuid references alphanauts(id) on delete cascade,
  block_id uuid references blocks(id) on delete cascade,
  role text default 'member' check (role in ('member', 'navigator')),
  joined_at timestamptz default now(),
  unique(alphanaut_id, block_id)
);

-- Papers (Knowledge Bridge)
create table if not exists papers (
  id uuid primary key default uuid_generate_v4(),
  title_ar text not null,
  title_en text,
  original_authors text,
  description_ar text,
  description_en text,
  field text check (field in ('medical', 'ai', 'stem', 'neuroscience', 'other')),
  tags text[],
  file_url text,
  cover_image_url text,
  download_count integer default 0,
  status text default 'draft' check (status in ('draft', 'under_review', 'published', 'rejected')),
  submitted_by uuid references alphanauts(id),
  reviewed_by uuid references alphanauts(id),
  navigator_notes text,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Research projects
create table if not exists research_projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  abstract text,
  field text,
  block_slug text references blocks(slug),
  status text default 'in_progress' check (status in ('in_progress', 'submitted', 'under_review', 'accepted', 'published', 'rejected')),
  journal text,
  doi text,
  file_url text,
  cover_image_url text,
  is_public boolean default false,
  created_by uuid references alphanauts(id),
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Research project authors (many-to-many)
create table if not exists research_authors (
  research_id uuid references research_projects(id) on delete cascade,
  alphanaut_id uuid references alphanauts(id) on delete cascade,
  author_order integer default 0,
  primary key (research_id, alphanaut_id)
);

-- Announcements
create table if not exists announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  type text default 'general' check (type in ('general', 'volunteer', 'event', 'research', 'urgent')),
  target_block text,  -- null = visible to all; set to block slug for block-specific
  is_published boolean default false,
  is_pinned boolean default false,
  created_by uuid references alphanauts(id),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Volunteer applications
create table if not exists volunteer_applications (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  university text,
  field_of_study text,
  preferred_blocks text[],
  motivation text,
  skills text,
  how_heard text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'waitlisted')),
  admin_notes text,
  reviewed_by uuid references alphanauts(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Admin users
create table if not exists admins (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  password_hash text not null,
  name text,
  created_at timestamptz default now()
);

-- Block Tasks (Navigator assigns to Alphanauts)
create table if not exists block_tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  block_slug text references blocks(slug) on delete cascade,
  assigned_to uuid references alphanauts(id) on delete cascade,
  assigned_by uuid references alphanauts(id),
  deadline timestamptz,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

-- Block Initiatives (open calls — "who wants to work on X?")
create table if not exists block_initiatives (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  block_slug text references blocks(slug) on delete cascade,
  created_by uuid references alphanauts(id),
  deadline timestamptz,
  status text default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz default now()
);

-- Initiative participants (join/decline)
create table if not exists initiative_participants (
  id uuid primary key default uuid_generate_v4(),
  initiative_id uuid references block_initiatives(id) on delete cascade,
  alphanaut_id uuid references alphanauts(id) on delete cascade,
  response text check (response in ('yes', 'no')),
  created_at timestamptz default now(),
  unique(initiative_id, alphanaut_id)
);

-- Block Suggestions (per-block idea board)
create table if not exists block_suggestions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  type text default 'idea' check (type in ('idea', 'paper', 'research', 'poster', 'topic', 'other')),
  block_slug text references blocks(slug) on delete cascade,
  suggested_by uuid references alphanauts(id),
  status text default 'open' check (status in ('open', 'under_review', 'approved', 'implemented', 'rejected')),
  created_at timestamptz default now()
);

-- Suggestion votes (upvotes)
create table if not exists suggestion_votes (
  suggestion_id uuid references block_suggestions(id) on delete cascade,
  alphanaut_id uuid references alphanauts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (suggestion_id, alphanaut_id)
);

-- Events (public + internal)
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  type text default 'workshop' check (type in ('workshop', 'talk', 'webinar', 'meeting', 'hackathon', 'other')),
  event_date timestamptz not null,
  end_date timestamptz,
  location text,
  link text,
  is_online boolean default false,
  is_public boolean default true,
  block_slug text,
  cover_image_url text,
  created_by uuid references alphanauts(id),
  created_at timestamptz default now()
);

-- Activity log
create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  actor_type text check (actor_type in ('alphanaut', 'admin')),
  actor_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- ========== INDEXES ==========
create index if not exists idx_papers_status on papers(status);
create index if not exists idx_papers_field on papers(field);
create index if not exists idx_papers_published_at on papers(published_at desc);
create index if not exists idx_research_status on research_projects(status);
create index if not exists idx_research_is_public on research_projects(is_public);
create index if not exists idx_announcements_published on announcements(is_published, published_at desc);
create index if not exists idx_applications_status on volunteer_applications(status);
create index if not exists idx_alphanaut_blocks_alphanaut on alphanaut_blocks(alphanaut_id);
create index if not exists idx_activity_log_created on activity_log(created_at desc);
create index if not exists idx_tasks_assigned_to on block_tasks(assigned_to);
create index if not exists idx_tasks_block on block_tasks(block_slug);
create index if not exists idx_tasks_status on block_tasks(status);
create index if not exists idx_initiatives_block on block_initiatives(block_slug);
create index if not exists idx_suggestions_block on block_suggestions(block_slug);
create index if not exists idx_events_date on events(event_date desc);
create index if not exists idx_events_public on events(is_public);

-- ========== ROW LEVEL SECURITY ==========
alter table alphanauts enable row level security;
alter table blocks enable row level security;
alter table alphanaut_blocks enable row level security;
alter table papers enable row level security;
alter table research_projects enable row level security;
alter table research_authors enable row level security;
alter table announcements enable row level security;
alter table volunteer_applications enable row level security;
alter table admins enable row level security;
alter table activity_log enable row level security;
alter table block_tasks enable row level security;
alter table block_initiatives enable row level security;
alter table initiative_participants enable row level security;
alter table block_suggestions enable row level security;
alter table suggestion_votes enable row level security;
alter table events enable row level security;

-- Public read policies (using service role from API routes bypasses RLS)
create policy "Public can read published papers" on papers
  for select using (status = 'published');

create policy "Public can read public research" on research_projects
  for select using (is_public = true);

create policy "Public can read published announcements" on announcements
  for select using (is_published = true);

create policy "Public can read active blocks" on blocks
  for select using (is_active = true);

create policy "Public can read public alphanauts" on alphanauts
  for select using (is_public = true and is_active = true);

create policy "Public can read public events" on events
  for select using (is_public = true);

-- Allow insert for volunteer applications (no auth needed)
create policy "Anyone can submit volunteer application" on volunteer_applications
  for insert with check (true);

-- ========== SEED DATA ==========

-- Insert initial blocks
insert into blocks (slug, name, description, icon, color) values
('knowledge-bridge', 'Knowledge Bridge', 'Translation & Simplification — Making global research accessible in Arabic', '📚', '#00B4D8'),
('asclepius-lab', 'Asclepius Lab', 'Med-AI Research — Building AI tools for Arabic medical education', '🏥', '#118AB2'),
('neuroscience', 'Neuroscience Research', 'ADHD, mental health, and neuroscience research in the Arab world', '🧠', '#9B59B6'),
('creative-lab', 'Creative Lab', 'Visual identity, design, and scientific visualization', '🎨', '#FF6B35'),
('science-comm', 'Science Communication', 'Social media, outreach, and community building', '📡', '#FFD700'),
('operations', 'Operations & Strategy', 'Project coordination, partnerships, and strategic planning', '⚙️', '#EDF2F4'),
('engineering', 'Engineering & Systems', 'Technical infrastructure, website, and tools development', '💻', '#1a1f3a')
on conflict (slug) do nothing;

-- Sample announcements (for demo)
insert into announcements (title, content, type, is_published, is_pinned, published_at) values
(
  'Welcome to AlphaX — From Knowledge Consumers to Knowledge Creators',
  'AlphaX is officially launching its public platform. We are a Syrian research collective dedicated to bridging the knowledge gap in the Arab world. Our three pillars — Translation & Access, Research & Innovation, and Training & Capacity Building — are now operational. Join us in transforming the Arab scientific landscape.',
  'general',
  true,
  true,
  now() - interval '2 days'
),
(
  'Open Volunteer Recruitment — All Blocks',
  'AlphaX is now accepting applications for all blocks: Knowledge Bridge, Asclepius Lab, Neuroscience Research, Creative Lab, Science Communication, Operations & Strategy, and Engineering & Systems. If you are passionate about advancing Arabic science and research, apply now through our Join page.',
  'volunteer',
  true,
  false,
  now() - interval '5 days'
),
(
  'Knowledge Bridge: First Arabic Research Translation Published',
  'We are thrilled to announce the publication of our first batch of translated research papers. The Knowledge Bridge team has translated 10 high-impact papers across medical AI, neuroscience, and STEM fields into Arabic. These are now freely available on our Knowledge Bridge page.',
  'research',
  true,
  false,
  now() - interval '10 days'
)
on conflict do nothing;

-- Note: Admin user should be created via API or seeded with a hashed password
-- Run this after generating a bcrypt hash of your password:
-- insert into admins (username, password_hash, name) values ('admin', '<bcrypt-hash>', 'AlphaX Admin');
