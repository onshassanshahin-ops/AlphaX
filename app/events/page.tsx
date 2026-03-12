import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { Calendar, MapPin, Video, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  event_date: string;
  end_date?: string;
  location?: string;
  link?: string;
  is_online: boolean;
  block_slug?: string;
}

async function getEvents() {
  const now = new Date().toISOString();
  const [upcoming, past] = await Promise.all([
    supabaseAdmin.from('events').select('*').eq('is_public', true).gte('event_date', now).order('event_date', { ascending: true }),
    supabaseAdmin.from('events').select('*').eq('is_public', true).lt('event_date', now).order('event_date', { ascending: false }).limit(6),
  ]);
  return { upcoming: upcoming.data || [], past: past.data || [] };
}

const typeColors: Record<string, string> = {
  workshop: '#00B4D8',
  talk: '#9B59B6',
  webinar: '#4FC3F7',
  meeting: '#FFD700',
  hackathon: '#FF6B35',
  other: '#94a3b8',
};

const typeLabel: Record<string, string> = {
  workshop: 'Workshop',
  talk: 'Talk',
  webinar: 'Webinar',
  meeting: 'Meeting',
  hackathon: 'Hackathon',
  other: 'Event',
};

function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  const date = new Date(event.event_date);
  const color = typeColors[event.type] || '#94a3b8';

  return (
    <div className={`glass-card rounded-2xl p-6 flex flex-col gap-4 border transition-all ${past ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan/5'}`}
      style={{ borderColor: past ? 'rgba(255,255,255,0.05)' : `${color}20` }}>
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
          style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}>
          {typeLabel[event.type] || 'Event'}
        </span>
        {past && (
          <span className="text-xs text-slate-600 border border-white/5 px-2 py-0.5 rounded-full">Past</span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold font-grotesk text-white mb-2">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{event.description}</p>
        )}
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar size={14} className="text-cyan shrink-0" />
          <span>{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock size={14} className="text-cyan shrink-0" />
          <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {(event.location || event.is_online) && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {event.is_online ? <Video size={14} className="text-teal shrink-0" /> : <MapPin size={14} className="text-teal shrink-0" />}
            <span>{event.is_online ? 'Online' : event.location}</span>
          </div>
        )}
      </div>

      {event.link && (
        <a href={event.link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:text-white transition-colors mt-1">
          Join / Learn More <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-15 pointer-events-none" />
        <div className="absolute top-32 left-1/3 w-64 h-64 bg-cyan/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan/30 bg-cyan/10 text-cyan text-sm font-medium mb-6">
            <Calendar size={14} />
            AlphaX Events
          </div>
          <h1 className="text-5xl font-bold font-grotesk text-white mb-5">
            Workshops, Talks &{' '}
            <span className="text-gradient">Community</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Join AlphaX events — workshops on research methods, science communication talks, webinars, and more.
          </p>
        </div>
      </section>

      {/* Upcoming */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold font-grotesk text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-6 rounded-full bg-cyan inline-block" />
            Upcoming Events
            {upcoming.length > 0 && (
              <span className="text-sm font-normal text-slate-500 ml-1">({upcoming.length})</span>
            )}
          </h2>

          {upcoming.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <Calendar size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-semibold mb-2">No upcoming events</p>
              <p className="text-slate-600 text-sm">Check back soon — AlphaX events are announced regularly.</p>
              <Link href="/announcements" className="inline-flex items-center gap-2 mt-6 text-cyan text-sm hover:text-white transition-colors">
                Follow announcements
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      {past.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold font-grotesk text-slate-500 mb-5 flex items-center gap-3">
              <span className="w-2 h-5 rounded-full bg-slate-600 inline-block" />
              Past Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.map(e => <EventCard key={e.id} event={e} past />)}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
