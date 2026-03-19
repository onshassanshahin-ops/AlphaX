-- Phase 2 product settings for ordered feature rollout
insert into site_settings (key, value)
values (
  'feature_flags',
  '{
    "homepage_blocks_editor": true,
    "widgets_marketplace": true,
    "smart_assignment_assistant": true,
    "notification_center": true,
    "okr_layer": true,
    "public_impact_dashboard": true,
    "knowledge_quality_scoring": true,
    "reliability_addons": true,
    "content_scheduling": true,
    "navigator_analytics": true,
    "block_ai_assistant": true
  }'::jsonb
)
on conflict (key) do nothing;

insert into site_settings (key, value)
values (
  'widget_layout',
  '{
    "show_notification_center": true,
    "show_mission_board": true,
    "show_team_health": true,
    "show_weekly_focus": true,
    "show_signal_stream": true,
    "show_activity_timeline": true
  }'::jsonb
)
on conflict (key) do nothing;

insert into site_settings (key, value)
values (
  'roadmap_settings',
  '{
    "phase": "phase-2",
    "ordered_features": [
      {"id": 1, "key": "homepage_blocks_editor", "name": "Homepage Content Blocks Editor"},
      {"id": 2, "key": "widgets_marketplace", "name": "Dashboard Widgets Marketplace"},
      {"id": 3, "key": "smart_assignment_assistant", "name": "Smart Assignment Assistant"},
      {"id": 4, "key": "notification_center", "name": "Notification Center"},
      {"id": 5, "key": "okr_layer", "name": "Goal / OKR Layer"},
      {"id": 6, "key": "public_impact_dashboard", "name": "Public Impact Dashboard"},
      {"id": 7, "key": "knowledge_quality_scoring", "name": "Knowledge Quality Scoring"},
      {"id": 8, "key": "reliability_addons", "name": "Reliability Add-ons"},
      {"id": 9, "key": "content_scheduling", "name": "Admin Scheduling"},
      {"id": 10, "key": "navigator_analytics", "name": "Navigator Analytics"}
    ]
  }'::jsonb
)
on conflict (key) do nothing;

insert into site_settings (key, value)
values (
  'ai_assistant_settings',
  '{
    "enabled": true,
    "provider": "pending",
    "status_message": "Coming soon",
    "prompts": {
      "knowledge-bridge": "Act as a knowledge translation coach. Use workflow, subgroup, and task context.",
      "asclepius-lab": "Act as a medical AI research strategist with practical weekly priorities.",
      "neuroscience": "Act as a neuroscience research mentor focused on methods and evidence quality.",
      "creative-lab": "Act as a creative director helping with campaigns and asset planning.",
      "science-comm": "Act as a science communication editor for clarity and impact.",
      "operations": "Act as an operations lead focused on execution and risk mitigation.",
      "engineering": "Act as a systems architect focused on reliability and maintainability."
    }
  }'::jsonb
)
on conflict (key) do nothing;