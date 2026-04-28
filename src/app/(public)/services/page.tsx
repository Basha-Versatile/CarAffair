'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wrench, Sparkles, Cog, Gauge, ShieldCheck, Truck, Zap, Disc, Snowflake, Battery, Droplets, Paintbrush,
  ArrowRight, CheckCircle2, Camera, ClipboardCheck, Receipt, Clock, Building2, Award, HardHat, Boxes,
} from 'lucide-react';

const categories = [
  {
    id: 'maintenance',
    title: 'Routine maintenance',
    desc: 'Manufacturer-recommended care that keeps your car healthy and your warranty valid.',
    items: [
      { icon: Wrench, name: 'Periodic Service', desc: 'Engine oil, filters, fluid top-ups, 25-point safety inspection.', from: '₹2,499', tat: 'Same day' },
      { icon: Droplets, name: 'Fluid Top-ups & Flush', desc: 'Coolant, brake fluid, transmission fluid replacement with OEM-grade fluids.', from: '₹1,499', tat: '2 hours' },
      { icon: Disc, name: 'Brake Service', desc: 'Pad replacement, rotor resurfacing, brake fluid bleed, calliper inspection.', from: '₹3,999', tat: 'Same day' },
    ],
  },
  {
    id: 'mechanical',
    title: 'Mechanical & electrical',
    desc: 'Diagnostics-led repairs from certified technicians. We don\'t guess — we measure.',
    items: [
      { icon: Cog, name: 'Suspension & Steering', desc: 'Shock absorbers, struts, bushings, computerised wheel alignment & balancing.', from: '₹4,499', tat: '1 day' },
      { icon: Battery, name: 'Battery & Electrical', desc: 'Battery health check, alternator, starter motor, complete wiring diagnostics.', from: '₹999', tat: '2 hours' },
      { icon: Snowflake, name: 'AC Service', desc: 'Gas refill, compressor check, blower fan, evaporator clean, leak detection.', from: '₹2,499', tat: '4 hours' },
      { icon: Zap, name: 'Engine Diagnostics', desc: 'OBD-II scan, sensor reads, fault-code report — sent to your phone.', from: '₹999', tat: '1 hour' },
    ],
  },
  {
    id: 'detailing',
    title: 'Detailing & body',
    desc: 'Premium finishes that make your car feel new again.',
    items: [
      { icon: Sparkles, name: 'Premium Detailing', desc: 'Interior shampoo, exterior polish, leather conditioning, dashboard treatment.', from: '₹4,999', tat: '1 day' },
      { icon: Paintbrush, name: 'Paint Correction & Coating', desc: 'Scratch removal, ceramic coating, paint protection film with multi-year warranty.', from: '₹14,999', tat: '2–3 days' },
    ],
  },
  {
    id: 'convenience',
    title: 'Convenience & care',
    desc: 'White-glove services that make car ownership effortless.',
    items: [
      { icon: Truck, name: 'Pickup & Drop', desc: 'Free doorstep pickup across Hyderabad, drop after service. Outside-zone fee shown upfront.', from: 'Free', tat: 'Same day' },
      { icon: ShieldCheck, name: 'Insurance Claims', desc: 'Cashless processing with 12+ major insurers. We handle paperwork end-to-end.', from: 'Free', tat: '7–10 days' },
      { icon: Gauge, name: 'Pre-purchase Inspection', desc: 'Buying a used car? Get a 100-point report with photos before you commit.', from: '₹1,999', tat: '2 hours' },
    ],
  },
];

const inclusions = [
  { icon: Camera, title: 'Photo handover', desc: 'Time- and GPS-stamped images of every panel.' },
  { icon: ClipboardCheck, title: 'Itemised quote', desc: 'You approve only what you want done.' },
  { icon: Receipt, title: 'GST-compliant invoice', desc: 'Digital, downloadable, sent on WhatsApp.' },
  { icon: ShieldCheck, title: '90-day warranty', desc: 'On both labour and parts we install.' },
];

const brands = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Kia', 'MG', 'Volkswagen', 'Skoda', 'BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Jaguar', 'Land Rover'];

const insurers = ['HDFC ERGO', 'ICICI Lombard', 'Bajaj Allianz', 'Tata AIG', 'Reliance General', 'New India Assurance', 'IFFCO Tokio', 'Cholamandalam'];

const facility = [
  { icon: HardHat, title: '8 service bays', desc: 'Dedicated bays for periodic, mechanical, detailing, and body work — no cross-contamination.' },
  { icon: Building2, title: '4,200 sq ft workshop', desc: 'Climate-controlled, ESD-safe electronics zone, dust-free detailing booth.' },
  { icon: Boxes, title: 'OEM-grade parts inventory', desc: 'On-site stock of high-turnover OEM parts. Specialty parts arrive in under 48 hours.' },
  { icon: Award, title: 'ISO 9001 certified', desc: 'Audited quality processes, calibrated equipment, every job logged.' },
];

export default function ServicesPage() {
  return (
    <div className="px-5 sm:px-8 pt-6 pb-12 space-y-6">
      {/* Hero */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-8 sm:p-14 text-center">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-red-500/15 blur-3xl pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Services</p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] leading-[0.95] tracking-tight">
            Everything your car
            <br />
            <span className="gradient-text">will ever need.</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-6 max-w-2xl mx-auto leading-relaxed">
            14 service categories. 40+ technicians. One transparent process. From a routine oil change
            to a full-body restoration — handled in-house, photographed, and warrantied.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <a key={c.id} href={`#${c.id}`} className="px-4 py-2 rounded-full text-xs font-medium glass-card hover:bg-[var(--bg-glass-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {c.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Inclusions */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {inclusions.map((it, idx) => (
            <motion.div key={it.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} className="glass-card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-red-500/20">
                <it.icon className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{it.title}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{it.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.map((cat, ci) => (
        <section key={cat.id} id={cat.id} className="max-w-7xl mx-auto">
          <div className="glass-panel p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-2">
                  Category {String(ci + 1).padStart(2, '0')} · {cat.items.length} services
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{cat.title}</h2>
                <p className="text-[var(--text-secondary)] mt-2 max-w-xl">{cat.desc}</p>
              </div>
              <Link href="/book" className="self-start sm:self-end inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-red-500 glass-card border border-red-500/30 hover:bg-red-500/5">
                Book this category <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.items.map((item, idx) => (
                <motion.div key={item.name} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04 }} className="group sheen glass-card p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-red-500" />
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500/60" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{item.name}</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1.5 leading-relaxed flex-1">{item.desc}</p>
                  <div className="mt-5 pt-4 border-t border-[var(--border-glass)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-tertiary)]">From <span className="text-[var(--text-primary)] font-semibold">{item.from}</span></span>
                    <span className="inline-flex items-center gap-1 text-[var(--text-tertiary)]">
                      <Clock className="h-3 w-3" /> {item.tat}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Brands serviced */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Brands we service</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
              Indian, European, Japanese, Korean — <span className="gradient-text">we know your car.</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              Our technicians are trained on 16+ major brands. We use OEM and OEM-equivalent parts only —
              every part traced and warranted.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {brands.map((b) => (
              <div key={b} className="glass-card px-4 py-3.5 text-center text-sm font-semibold text-[var(--text-primary)]">
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insurance partners */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Insurance partners</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-[1.05]">
                Cashless claims with 12+ insurers.
              </h2>
              <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
                Skip the paperwork. We coordinate the entire claim — from survey to settlement — with all
                major insurers. You just collect your repaired car.
              </p>
              <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:gap-3 transition-all">
                Start a claim <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {insurers.map((i) => (
                <div key={i} className="glass-card px-3 py-4 text-center text-xs font-semibold text-[var(--text-primary)]">
                  {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workshop facility */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Our workshop</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
              Modern facility. <span className="gradient-text">Calibrated equipment.</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              You wouldn&apos;t trust your car to a back-alley garage. Neither would we.
            </p>
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

      {/* CTA */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-8 sm:p-12 text-center">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-red-700/15 blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Don&apos;t see your service?</h2>
          <p className="text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">
            Tell us what you need on the booking form. Our advisor will reach out before confirming and
            give you a clear quote upfront — no surprises.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book" className="sheen inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)] transition-all">
              Book a service <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="tel:+919999999999" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold glass-card text-[var(--text-primary)]">
              Call advisor
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
