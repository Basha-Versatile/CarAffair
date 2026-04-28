'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Eye, Heart, Award, ArrowRight, Wrench, Sparkles, MapPin, Calendar, Users, Car,
  Newspaper, Building2, GraduationCap, HardHat, Quote, Trophy,
} from 'lucide-react';

const values = [
  { icon: Eye, title: 'Radical transparency', desc: 'Photos, GPS-stamped, before & after. Itemised quotes you can decline. No fine print, no hidden charges.' },
  { icon: ShieldCheck, title: 'Accountable craftsmanship', desc: 'Every job has a named technician and a service advisor. Your car is somebody\'s personal responsibility.' },
  { icon: Heart, title: 'Owner-first decisions', desc: 'We say no to upsells. We recommend the right service for your car, not the most expensive one.' },
  { icon: Award, title: 'Modern garage standards', desc: 'Climate-controlled bays, calibrated equipment, OEM-grade parts, and a digital paper trail for every visit.' },
];

const milestones = [
  { year: '2024', title: 'Founded', desc: 'Started with one bay in Banjara Hills and a promise: no more workshop mysteries.' },
  { year: '2024', title: '1,000 cars serviced', desc: 'Crossed our first milestone six months in. WhatsApp updates went viral with our customers.' },
  { year: '2025', title: 'Pickup network launched', desc: 'Free pickup & drop launched across 18 Hyderabad neighbourhoods.' },
  { year: '2025', title: 'ISO 9001 certified', desc: 'Audited quality processes, calibrated equipment, every job logged.' },
  { year: '2026', title: '12,000+ owners', desc: 'Trusted by thousands of owners — and rated 4.9/5 across 2,400 reviews.' },
];

const stats = [
  { icon: Calendar, value: '2024', label: 'Founded' },
  { icon: Car, value: '12,000+', label: 'Cars serviced' },
  { icon: Users, value: '40+', label: 'Team members' },
  { icon: Award, value: '4.9/5', label: 'Average rating' },
];

const leaders = [
  { name: 'Arjun Reddy', role: 'Founder & CEO', bio: 'Ex-automotive consultant who got tired of being lied to at workshops. Built Car Affair to be the workshop he wished existed.', initials: 'AR' },
  { name: 'Meera Iyer', role: 'Head of Operations', bio: '14 years in luxury auto service. Designs every customer journey at Car Affair to feel effortless.', initials: 'MI' },
  { name: 'Suresh Babu', role: 'Master Technician & Tech Lead', bio: '22 years on the floor — Mercedes, BMW, Audi certified. Personally trains every new technician.', initials: 'SB' },
  { name: 'Kavya Nair', role: 'Customer Experience Lead', bio: 'Owns the WhatsApp updates, the photo handover, and the post-service follow-up. The reason 4.9/5 holds.', initials: 'KN' },
];

const facility = [
  { icon: HardHat, title: '8 service bays', desc: 'Dedicated bays — periodic, mechanical, detailing, body work — no cross-contamination, faster turnaround.' },
  { icon: Building2, title: '4,200 sq ft workshop', desc: 'Climate-controlled, ESD-safe electronics zone, dust-free detailing booth, customer waiting lounge.' },
  { icon: GraduationCap, title: '40+ trained staff', desc: 'OEM-trained technicians, named service advisors, in-house parts specialists.' },
  { icon: Award, title: 'ISO 9001 certified', desc: 'Audited quality processes, calibrated equipment, every job logged digitally.' },
];

const press = [
  { outlet: 'YourStory', headline: '"Hyderabad workshop ditches the upsell — and customers love it"' },
  { outlet: 'The Hindu', headline: '"How a digital-first garage is rewriting trust in auto service"' },
  { outlet: 'Inc42', headline: '"Car Affair raises seed round to scale transparent auto-care across South India"' },
];

export default function AboutPage() {
  return (
    <div className="px-5 sm:px-8 pt-6 pb-12 space-y-6">
      {/* Hero */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-8 sm:p-12 lg:p-16 grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-red-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-red-700/15 blur-3xl pointer-events-none" />
          <div className="relative lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">About Car Affair</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] leading-[0.95] tracking-tight">
              Car servicing
              <br /><span className="gradient-text">shouldn&apos;t feel</span>
              <br />like a gamble.
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-7 max-w-xl leading-relaxed">
              For decades, owners have walked into workshops, handed over their keys, and hoped for the best.
              We started Car Affair to flip that model — every step recorded, photographed, priced upfront,
              and shared with you in real time.
            </p>
            <div className="mt-8 flex gap-3 flex-wrap">
              <Link href="/services" className="sheen inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)] transition-all">
                Explore services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold glass-card text-[var(--text-primary)]">
                Visit our workshop
              </Link>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative lg:col-span-2">
            <div className="aspect-square rounded-[2rem] glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/15 via-transparent to-red-700/15" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Wrench className="w-1/2 h-auto text-red-500/35 drop-shadow-[0_0_60px_rgba(220,38,38,0.4)]" strokeWidth={1.2} />
              </div>
              <div className="absolute top-5 left-5 px-3 py-1.5 rounded-full glass-panel text-[10px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-red-500" /> Hyderabad's #1
              </div>
              <div className="absolute bottom-5 right-5 px-3 py-1.5 rounded-full glass-panel text-[10px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-red-500" /> Banjara Hills
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, idx) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} className="glass-card p-7 text-center">
              <s.icon className="h-5 w-5 text-red-500 mx-auto mb-3" />
              <p className="text-3xl sm:text-4xl font-bold gradient-text">{s.value}</p>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mt-2">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission / Vision / Founder note */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12 grid lg:grid-cols-3 gap-6">
          <div className="glass-card p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Mission</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
              Make car servicing <span className="gradient-text">honest, simple, and human.</span>
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mt-4 leading-relaxed">
              Every owner deserves to know exactly what was done to their car, why, and what it cost — without
              having to ask twice.
            </p>
          </div>
          <div className="glass-card p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Vision</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
              India&apos;s most trusted <span className="gradient-text">car-care brand.</span>
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mt-4 leading-relaxed">
              A network of transparent workshops where owners walk in with confidence, walk out with clarity,
              and never feel like they were taken advantage of.
            </p>
          </div>
          <div className="glass-card p-7 relative">
            <Quote className="absolute top-6 right-6 h-8 w-8 text-red-500/15" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Founder note</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
              &ldquo;I started Car Affair after my own car was returned with a ₹35,000 invoice and no explanation.
              I asked questions; the workshop changed the subject. That same week I decided to build the workshop
              I wished existed — and refused to compromise on a single principle.&rdquo;
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mt-5">Arjun Reddy</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Founder &amp; CEO, Car Affair</p>
          </div>
        </div>
      </section>

      {/* Story timeline */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Our story</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight">
              From one bay <br />to a movement.
            </h2>
          </div>
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-3 sm:left-1/2 top-0 bottom-0 w-px bg-[var(--border-glass)]" />
            <div className="space-y-12">
              {milestones.map((m, idx) => (
                <motion.div
                  key={`${m.year}-${m.title}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className={`relative pl-12 sm:pl-0 sm:grid sm:grid-cols-2 sm:gap-12 ${
                    idx % 2 === 0 ? 'sm:[&>*:first-child]:text-right' : 'sm:[&>*:last-child]:order-first sm:[&>*:last-child]:text-right'
                  }`}
                >
                  <div className="absolute left-0 sm:left-1/2 top-2 -translate-x-[5px] sm:-translate-x-1/2 w-3 h-3 rounded-full bg-red-500 ring-4 ring-[var(--bg-glass-strong)]" />
                  <div className={idx % 2 === 0 ? '' : 'sm:order-last'}>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">{m.year}</p>
                    <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{m.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">The people behind Car Affair</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
              Owners, advisors, technicians. <span className="gradient-text">All accountable.</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              We are 40+ humans — trained, badged, and personally responsible for every car that comes in.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaders.map((l, idx) => (
              <motion.div key={l.name} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} className="glass-card p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-lg font-bold mb-4">
                  {l.initials}
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">{l.name}</p>
                <p className="text-[11px] text-red-500 font-semibold uppercase tracking-wider mt-1">{l.role}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-3 leading-relaxed">{l.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">What we stand for</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)]">Our values.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((v, idx) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="group glass-card p-7 flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-600/15 ring-1 ring-red-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <v.icon className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{v.title}</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mt-2 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facility */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">The workshop</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
              Modern facility. <span className="gradient-text">Calibrated equipment.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {facility.map((f, idx) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="glass-card p-7 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">{f.title}</p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Press / In the news */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center flex-shrink-0">
              <Newspaper className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">In the news</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1">What people are saying.</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {press.map((p, idx) => (
              <motion.div key={p.outlet} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="glass-card p-6 flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">{p.outlet}</p>
                <p className="text-sm text-[var(--text-primary)] mt-3 leading-relaxed font-medium flex-1">{p.headline}</p>
                <Trophy className="h-5 w-5 text-amber-500 mt-5" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-8 sm:p-12 text-center">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-red-700/15 blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Visit our workshop.</h2>
          <p className="text-[var(--text-secondary)] mt-3">
            Banjara Hills, Hyderabad · Open Monday to Saturday, 9 AM – 7 PM. Walk-ins welcome.
          </p>
          <Link href="/contact" className="mt-7 sheen inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)] transition-all">
            Get in touch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
