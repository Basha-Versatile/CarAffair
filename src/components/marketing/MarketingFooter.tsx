'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Globe, MessageCircle, Share2, Mail, MapPin, Phone, Clock, ArrowRight, ShieldCheck, BadgeCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';

const linkSections = [
  {
    title: 'Services',
    links: [
      { href: '/services', label: 'Periodic service' },
      { href: '/services', label: 'Detailing & coating' },
      { href: '/services', label: 'AC service' },
      { href: '/services', label: 'Insurance claims' },
      { href: '/services', label: 'Pickup & drop' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Customers',
    links: [
      { href: '/book', label: 'Book a service' },
      { href: '/me', label: 'My account' },
      { href: '/me/appointments', label: 'My appointments' },
      { href: '/me/invoices', label: 'My invoices' },
    ],
  },
];

export default function MarketingFooter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
  };

  return (
    <footer className="relative px-5 sm:px-8 pb-8 pt-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Newsletter glass card */}
        <div className="glass-panel relative p-8 sm:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-red-500/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500">
              <Sparkles className="h-3 w-3" /> Stay sharp
            </span>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold text-[var(--text-primary)] leading-tight">
              Service tips &amp; exclusive offers in your inbox.
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">No spam. Unsubscribe in one click.</p>
          </div>
          <form onSubmit={onSubscribe} className="relative flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-5 py-3.5 rounded-xl glass-card text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
            <button
              type="submit"
              className="sheen inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)] transition-all"
            >
              {submitted ? 'Subscribed ✓' : 'Subscribe'}
              {!submitted && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Main footer glass panel */}
        <div className="glass-panel p-8 sm:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
            <div className="col-span-2 lg:col-span-3 space-y-5">
              <Link href="/" className="inline-flex items-center gap-2">
                <Image src="/logo.png" alt="Car Affair" width={512} height={100} className="h-11 w-auto logo-adaptive" />
              </Link>
              <p className="text-sm text-[var(--text-tertiary)] max-w-md leading-relaxed">
                Premium car servicing built around transparency, real-time updates, and pickup-to-delivery
                convenience. Trusted by 12,000+ owners across Hyderabad.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-[11px] text-[var(--text-secondary)]">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> ISO certified workshop
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-[11px] text-[var(--text-secondary)]">
                  <BadgeCheck className="h-3 w-3 text-blue-500" /> 4.9 / 5 · 2,400+ reviews
                </span>
              </div>

              <div className="space-y-2.5 text-sm text-[var(--text-secondary)] pt-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Plot No. 42, Road No. 12,<br />Banjara Hills, Hyderabad — 500034</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <a href="tel:+919999999999" className="hover:text-red-500 transition-colors">+91 99999 99999</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <a href="mailto:hello@caraffair.com" className="hover:text-red-500 transition-colors">hello@caraffair.com</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>Mon – Sat · 9:00 AM – 7:00 PM</span>
                </div>
              </div>
            </div>

            {linkSections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-5">
                  {section.title}
                </p>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-[var(--border-glass)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--text-tertiary)]">
              &copy; {new Date().getFullYear()} Car Affair. All rights reserved. ·{' '}
              <Link href="/contact" className="hover:text-red-500">Privacy</Link> ·{' '}
              <Link href="/contact" className="hover:text-red-500">Terms</Link>
            </p>
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <a href="#" aria-label="Website" className="w-9 h-9 rounded-xl flex items-center justify-center glass-card hover:text-red-500"><Globe className="h-4 w-4" /></a>
              <a href="#" aria-label="Chat" className="w-9 h-9 rounded-xl flex items-center justify-center glass-card hover:text-red-500"><MessageCircle className="h-4 w-4" /></a>
              <a href="#" aria-label="Share" className="w-9 h-9 rounded-xl flex items-center justify-center glass-card hover:text-red-500"><Share2 className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
