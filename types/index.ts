export type Role = 'alphanaut' | 'navigator' | 'co-captain';
export type BlockRole = 'member' | 'navigator';
export type PaperStatus = 'draft' | 'under_review' | 'published' | 'rejected';
export type ResearchStatus = 'in_progress' | 'submitted' | 'under_review' | 'accepted' | 'published' | 'rejected';
export type AnnouncementType = 'general' | 'volunteer' | 'event' | 'research' | 'urgent';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'waitlisted';
export type PaperField = 'medical' | 'ai' | 'stem' | 'neuroscience' | 'other';

export interface Alphanaut {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  university?: string;
  field_of_study?: string;
  access_code: string;
  role: Role;
  bio?: string;
  avatar_url?: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  // Joined fields
  blocks?: AlphanautBlock[];
}

export interface Block {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  navigator_id?: string;
  is_active: boolean;
  created_at: string;
  // Joined fields
  navigator?: Alphanaut;
  member_count?: number;
}

export interface AlphanautBlock {
  id: string;
  alphanaut_id: string;
  block_id: string;
  role: BlockRole;
  joined_at: string;
  // Joined fields
  block?: Block;
  alphanaut?: Alphanaut;
}

export interface Paper {
  id: string;
  title_ar: string;
  title_en?: string;
  original_authors?: string;
  description_ar?: string;
  description_en?: string;
  field?: PaperField;
  tags?: string[];
  file_url?: string;
  cover_image_url?: string;
  download_count: number;
  status: PaperStatus;
  submitted_by?: string;
  reviewed_by?: string;
  navigator_notes?: string;
  published_at?: string;
  created_at: string;
  // Joined fields
  submitter?: Alphanaut;
  reviewer?: Alphanaut;
}

export interface ResearchProject {
  id: string;
  title: string;
  abstract?: string;
  field?: string;
  block_slug?: string;
  status: ResearchStatus;
  journal?: string;
  doi?: string;
  file_url?: string;
  cover_image_url?: string;
  is_public: boolean;
  created_by?: string;
  published_at?: string;
  created_at: string;
  // Joined fields
  authors?: ResearchAuthor[];
  block?: Block;
}

export interface ResearchAuthor {
  research_id: string;
  alphanaut_id: string;
  author_order: number;
  // Joined fields
  alphanaut?: Alphanaut;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  is_published: boolean;
  is_pinned: boolean;
  created_by?: string;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  // Joined fields
  creator?: Alphanaut;
}

export interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  phone?: string;
  university?: string;
  field_of_study?: string;
  preferred_blocks?: string[];
  motivation?: string;
  skills?: string;
  how_heard?: string;
  status: ApplicationStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Admin {
  id: string;
  username: string;
  name?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_type: 'alphanaut' | 'admin';
  actor_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// Session types
export interface PortalSession {
  alphanaut_id: string;
  name: string;
  role: Role;
  blocks: string[]; // all block slugs this user has access to
  navigatorBlocks: string[]; // block slugs where this user has navigator role
}

export interface AdminSession {
  admin_id: string;
  username: string;
  name?: string;
}

// Form types
export interface VolunteerFormData {
  name: string;
  email: string;
  phone: string;
  university: string;
  field_of_study: string;
  preferred_blocks: string[];
  motivation: string;
  skills: string;
  how_heard: string;
}

export interface PaperFormData {
  title_ar: string;
  title_en: string;
  original_authors: string;
  description_ar: string;
  description_en: string;
  field: PaperField;
  tags: string[];
  file?: File;
}

// Stats type
export interface SiteStats {
  papers_translated: number;
  members: number;
  publications: number;
  tools: number;
}

// Block definitions (static config)
export const BLOCKS_CONFIG = [
  {
    slug: 'knowledge-bridge',
    name: 'Knowledge Bridge',
    icon: '📚',
    color: '#00B4D8',
    description: 'Translating global research into Arabic',
    portalPath: '/portal/dashboard/knowledge-bridge',
  },
  {
    slug: 'asclepius-lab',
    name: 'Asclepius Lab',
    icon: '🏥',
    color: '#118AB2',
    description: 'Med-AI research and tools',
    portalPath: '/portal/dashboard/research',
  },
  {
    slug: 'neuroscience',
    name: 'Neuroscience Research',
    icon: '🧠',
    color: '#9B59B6',
    description: 'Brain science and mental health research',
    portalPath: '/portal/dashboard/research',
  },
  {
    slug: 'creative-lab',
    name: 'Creative Lab',
    icon: '🎨',
    color: '#FF6B35',
    description: 'Design and visual identity',
    portalPath: '/portal/dashboard/creative-lab',
  },
  {
    slug: 'science-comm',
    name: 'Science Communication',
    icon: '📡',
    color: '#FFD700',
    description: 'Outreach and social media',
    portalPath: '/portal/dashboard/science-comm',
  },
  {
    slug: 'operations',
    name: 'Operations & Strategy',
    icon: '⚙️',
    color: '#EDF2F4',
    description: 'Coordination and strategy',
    portalPath: '/portal/dashboard/operations',
  },
  {
    slug: 'engineering',
    name: 'Engineering & Systems',
    icon: '💻',
    color: '#4FC3F7',
    description: 'Technical infrastructure',
    portalPath: '/portal/dashboard/operations',
  },
] as const;
