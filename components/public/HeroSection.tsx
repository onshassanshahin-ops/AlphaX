'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  twinkle: number;
}

interface Connection {
  a: number;
  b: number;
  dist: number;
}

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      const count = Math.floor((canvas.width * canvas.height) / 12000);
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const twinkleOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.twinkle));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 180, 216, ${twinkleOpacity})`;
        ctx.fill();

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 180, 216, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg">
      {/* Animated canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.8 }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/20 via-transparent to-bg/80 pointer-events-none" />
      <div className="absolute inset-0 hero-grid pointer-events-none opacity-30" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan/30 bg-cyan/10 text-cyan text-sm font-medium mb-8 animate-fade-in">
          <Sparkles size={14} />
          Syrian Research Collective
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-grotesk text-white mb-6 leading-tight animate-slide-up">
          From Knowledge{' '}
          <span className="text-gradient">Consumers</span>
          <br />
          to Knowledge{' '}
          <span className="text-gradient">Creators</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
          AlphaX bridges the gap between global science and the Arab world — translating
          research, publishing discoveries, and training the next generation of Arab scientists.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
          <Link
            href="/knowledge-bridge"
            className="btn-primary flex items-center gap-2 text-base px-8 py-4"
          >
            Explore Research
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/join"
            className="px-8 py-4 rounded-lg border border-cyan/30 text-cyan text-base font-semibold hover:bg-cyan/10 hover:border-cyan/50 transition-all duration-300"
          >
            Join the Collective
          </Link>
        </div>

        {/* Partnership strip */}
        <div className="mt-8 animate-fade-in">
          <p className="text-sm text-slate-300 mb-3">
            AlphaX collaborate with Syrian Virtual University (SVU)
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="glass-card-light rounded-xl px-4 py-2.5">
              <Image
                src="/partners/alphax-logo.png"
                alt="AlphaX logo"
                width={220}
                height={64}
                className="h-14 w-auto max-w-none"
                priority
              />
            </div>
            <div className="glass-card-light rounded-xl px-4 py-2.5">
              <Image
                src="/partners/svu-logo.png"
                alt="SVU logo "
                width={220}
                height={64}
                className="h-10 w-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-bounce">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-slate-600 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-cyan animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
