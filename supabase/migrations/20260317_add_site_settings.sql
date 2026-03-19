-- Site settings table for admin-editable content
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_by text,
  updated_at timestamptz default now()
);

-- Default homepage hero settings
insert into site_settings (key, value) values (
  'hero',
  '{
    "badge": "Syrian Research Collective",
    "title_line1": "From Knowledge",
    "highlight1": "Consumers",
    "title_line2": "to Knowledge",
    "highlight2": "Creators",
    "subtitle": "AlphaX bridges the gap between global science and the Arab world — translating research, publishing discoveries, and training the next generation of Arab scientists.",
    "cta_primary": "Explore Research",
    "cta_secondary": "Join the Collective",
    "partner_text": "AlphaX collaborate with Syrian Virtual University (SVU)"
  }'::jsonb
) on conflict (key) do nothing;

-- Default dashboard banner texts
insert into site_settings (key, value) values (
  'dashboard_banners',
  '{
    "portal_welcome": "This is your live pulse feed: block access, current mission tasks, announcements, and your contribution history.",
    "knowledge_bridge_header": "Translate. Validate. Publish.",
    "research_header": "Research in Progress",
    "creative_lab_header": "Create. Communicate. Inspire.",
    "science_comm_header": "Science Communication Hub",
    "operations_header": "Operations Control",
    "engineering_header": "Build the Infrastructure"
  }'::jsonb
) on conflict (key) do nothing;
