'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, ArrowRight, ChevronDown, Sparkles, ShieldCheck, BadgeCheck, RefreshCw, HeartHandshake, Quote, Star, MessageSquareText,
} from 'lucide-react';

const tiers = [
  {
    name: 'Essential',
    description: 'Routine service to keep your car running well.',
    priceFrom: 2499,
    badge: null,
    bestFor: 'Hatchbacks · Sedans · ≤ 50,000 km',
    features: [
      'Engine oil + filter change (5W-30 / 5W-40 OEM grade)',
      '25-point multi-point inspection',
      'Brake & tire safety check',
      'Battery & all fluid top-up',
      'Pickup & drop within 8 km',
      'Digital invoice on WhatsApp',
    ],
  },
  {
    name: 'Performance',
    description: 'Comprehensive service for daily-driven cars.',
    priceFrom: 5999,
    badge: 'Most popular',
    bestFor: 'Most cars · Annual / 10,000 km service',
    features: [
      'Everything in Essential',
      'AC service + gas top-up',
      'Computerised wheel alignment & balancing',
      'Air & cabin filter replacement',
      'Brake fluid replacement',
      'Photo handover at pickup & drop',
      'Free pickup across Hyderabad',
    ],
  },
  {
    name: 'Concierge',
    description: 'Premium care with detailing and white-glove handling.',
    priceFrom: 12999,
    badge: null,
    bestFor: 'Luxury · SUVs · Performance vehicles',
    features: [
      'Everything in Performance',
      'Premium interior detailing',
      'Exterior polish & paint correction',
      'Underbody anti-rust coating',
      'Dedicated service advisor',
      'Loaner car (subject to availability)',
    ],
  },
];

const compare = [
  { feature: 'Engine oil + filter', essential: true, performance: true, concierge: true },
  { feature: '25-point inspection', essential: true, performance: true, concierge: true },
  { feature: 'Pickup & drop', essential: '< 8 km', performance: 'Hyderabad', concierge: 'Hyderabad' },
  { feature: 'AC service', essential: false, performance: true, concierge: true },
  { feature: 'Wheel alignment', essential: false, performance: true, concierge: true },
  { feature: 'Photo handover', essential: false, performance: true, concierge: true },
  { feature: 'Premium detailing', essential: false, performance: false, concierge: true },
  { feature: 'Paint correction', essential: false, performance: false, concierge: true },
  { feature: 'Loaner car', essential: false, performance: false, concierge: true },
  { feature: 'Dedicated advisor', essential: false, performance: false, concierge: true },
];

const promises = [
  {
    icon: ShieldCheck,
    title: '90-day warranty',
    desc: 'On every service. Both labour and parts. If something fails, we fix it free — pickup included.',
  },
  {
    icon: HeartHandshake,
    title: 'No-upsell promise',
    desc: 'We recommend the right service for your car. If it doesn\'t need a part, we don\'t replace it.',
  },
  {
    icon: BadgeCheck,
    title: 'Itemised quote',
    desc: 'Approve item by item. Decline anything you don\'t want. No minimums, no fine print.',
  },
  {
    icon: RefreshCw,
    title: 'Cancel anytime',
    desc: 'Free cancellation before your scheduled slot. No deposit. No penalty. No hard feelings.',
  },
];

const savingsStories = [
  { name: 'Ravi M.', car: 'Honda City', saved: '₹6,200', detail: 'Declined unnecessary spark plug replacement after seeing the inspection photos.' },
  { name: 'Anjali T.', car: 'Hyundai Verna', saved: '₹4,800', detail: 'Chose to skip optional underbody coating. Mechanic confirmed it wasn\'t due.' },
  { name: 'Karthik R.', car: 'Mahindra Thar', saved: '₹11,500', detail: 'Insurance handled the bumper repair entirely cashless. Zero out-of-pocket.' },
];

const faqs = [
  { q: 'Will the price change after inspection?', a: 'Possibly — if the technician spots something the package doesn\'t cover. You\'ll always get an itemised quote on WhatsApp before any extra work starts. You can approve or decline each item.' },
  { q: 'Is GST included in the listed price?', a: 'Prices are quoted before GST. The final invoice includes 18% GST and you\'ll always see a clear breakdown.' },
  { q: 'Is pickup & drop really free?', a: 'Yes, anywhere within Hyderabad city limits. Outside the city, a small distance fee applies — shown to you before you confirm the booking.' },
  { q: 'What payment methods do you accept?', a: 'Cash, UPI, debit/credit card, NEFT, or pay-later via select partners. Whatever works for you.' },
  { q: 'Do you offer warranty on the work?', a: 'Yes. Every service comes with a 90-day warranty on labour and the parts we install. Pickup for warranty work is on us.' },
  { q: 'Can I track my car during service?', a: 'Absolutely. You\'ll get WhatsApp updates at every stage, plus access to your customer portal where you can see live status, photos, and the quote.' },
  { q: 'What happens if I decline a service in the quote?', a: 'We simply don\'t do it. No questions asked, no pressure. You only pay for what you approve.' },
  { q: 'Do you price-match other workshops?', a: 'For comparable scope and equivalent OEM parts, yes. Send us the other quote and we\'ll match it — or tell you honestly why we can\'t.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="font-semibold text-[var(--text-primary)] text-sm sm:text-base pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="px-5 sm:px-8 pt-6 pb-12 space-y-6">
      {/* Hero */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-8 sm:p-14 text-center">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-red-500/15 blur-3xl pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Pricing</p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] leading-[0.95] tracking-tight">
            Transparent packages.
            <br />
            <span className="gradient-text">Itemised quotes.</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-6 max-w-2xl mx-auto leading-relaxed">
            Pick a starting package or build your own. Either way, you&apos;ll see an itemised quote
            before any work begins — and you can decline anything you don&apos;t want. No minimums.
            No surprises. No upsells.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-xs text-[var(--text-secondary)]"><ShieldCheck className="h-3 w-3 text-emerald-500" /> 90-day warranty</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-xs text-[var(--text-secondary)]"><BadgeCheck className="h-3 w-3 text-blue-500" /> GST-compliant invoice</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-xs text-[var(--text-secondary)]"><RefreshCw className="h-3 w-3 text-amber-500" /> Free cancellation</span>
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
          {tiers.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className={
                'relative p-7 lg:p-8 rounded-3xl flex flex-col glass-panel ' +
                (t.badge ? 'ring-2 ring-red-500/30 shadow-[0_30px_70px_-20px_rgba(220,38,38,0.45)]' : '')
              }
            >
              {t.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.7)]">
                  <Sparkles className="h-3 w-3" /> {t.badge}
                </span>
              )}
              {t.badge && <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />}
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">{t.name}</h3>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">{t.description}</p>
              <p className="text-[11px] text-red-500 mt-3 font-semibold uppercase tracking-wider">{t.bestFor}</p>
              <div className="mt-6 pb-6 border-b border-[var(--border-glass)]">
                <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Starting from</p>
                <p className="text-5xl font-bold text-[var(--text-primary)] mt-1">
                  ₹{t.priceFrom.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1.5">+ GST · varies by car &amp; condition</p>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-500/30">
                      <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/book"
                className={
                  'mt-8 sheen inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all ' +
                  (t.badge
                    ? 'text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_14px_30px_-10px_rgba(220,38,38,0.6)]'
                    : 'text-[var(--text-primary)] glass-card')
                }
              >
                Book {t.name} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom quote banner */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-8 sm:p-10 grid md:grid-cols-3 gap-6 items-center">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-red-500/15 blur-3xl pointer-events-none" />
          <div className="md:col-span-2 relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-2">Build your own</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
              Specific issue? Get a free custom quote.
            </h3>
            <p className="text-[var(--text-secondary)] mt-2 leading-relaxed">
              Tell us what&apos;s wrong and our advisor will give you a clear quote in under an hour.
              Free of charge. No commitment.
            </p>
          </div>
          <div className="relative md:text-right">
            <Link href="/contact" className="sheen inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)]">
              <MessageSquareText className="h-4 w-4" /> Request a quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-6 sm:p-10">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Compare</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">What you get in each tier.</h2>
          </div>
          <div className="rounded-2xl glass-card overflow-hidden overflow-x-auto">
            <div className="grid grid-cols-4 gap-px bg-[var(--border-glass)] text-xs sm:text-sm min-w-[36rem]">
              <div className="bg-[var(--bg-glass-strong)] px-4 py-4 font-semibold text-[var(--text-primary)]">Feature</div>
              <div className="bg-[var(--bg-glass-strong)] px-4 py-4 font-semibold text-[var(--text-primary)] text-center">Essential</div>
              <div className="bg-red-500/10 px-4 py-4 font-semibold text-red-500 text-center">Performance</div>
              <div className="bg-[var(--bg-glass-strong)] px-4 py-4 font-semibold text-[var(--text-primary)] text-center">Concierge</div>
              {compare.map((row) => (
                <div key={row.feature} className="contents">
                  <div className="bg-[var(--bg-glass)] px-4 py-3.5 text-[var(--text-secondary)]">{row.feature}</div>
                  {[row.essential, row.performance, row.concierge].map((v, i) => (
                    <div key={i} className={`px-4 py-3.5 text-center text-[var(--text-secondary)] ${i === 1 ? 'bg-red-500/[0.06]' : 'bg-[var(--bg-glass)]'}`}>
                      {v === true ? <Check className="h-4 w-4 text-emerald-500 mx-auto" strokeWidth={3} />
                        : v === false ? <X className="h-4 w-4 text-[var(--text-tertiary)]/60 mx-auto" />
                          : <span className="text-xs">{v}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Our promises</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
              Four promises. <span className="gradient-text">Written down.</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              Marketing copy is cheap. These are commitments — and you can hold us to every one.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {promises.map((p, idx) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="glass-card p-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{p.title}</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-2 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Savings stories */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Real savings</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
              How customers save with our quote system.
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              You see what we recommend. You decide what we do. The result? Real money saved.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {savingsStories.map((s, idx) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="relative glass-card p-6">
                <Quote className="absolute top-5 right-5 h-7 w-7 text-red-500/15" />
                <div className="text-3xl font-bold gradient-text">{s.saved}</div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1">Saved on this visit</p>
                <p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed">&ldquo;{s.detail}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-[var(--border-glass)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
                    {s.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{s.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] truncate">{s.car} · Owner</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Questions</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Frequently asked.</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (<FaqItem key={f.q} q={f.q} a={f.a} />))}
          </div>
        </div>
      </section>
    </div>
  );
}
