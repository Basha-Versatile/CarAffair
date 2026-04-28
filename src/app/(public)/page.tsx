'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Wrench, Sparkles, Cog, Gauge, ShieldCheck, Calendar, MessageCircle, Star, Truck,
  Camera, Receipt, ClipboardCheck, Quote, PlayCircle, Car, PhoneCall, Award, HeartHandshake,
  AlertTriangle, XCircle, DollarSign, Frown, Smartphone, Bot, MapPinned, Building2, BadgeCheck,
  Trophy, GraduationCap, ChevronDown,
} from 'lucide-react';

// Brand logos are loaded from /public/brands/ — drop one file per brand using the
// `slug` below (e.g. /public/brands/bmw.svg). SVG preferred; PNG works too.
const trustLogos: { name: string; slug: string }[] = [
  { name: 'BMW', slug: 'bmw' },
  { name: 'Mercedes-Benz', slug: 'mercedes-benz' },
  { name: 'Audi', slug: 'audi' },
  { name: 'Porsche', slug: 'porsche' },
  { name: 'Tata', slug: 'tata' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Mahindra', slug: 'mahindra' },
  { name: 'Kia', slug: 'kia' },
  { name: 'MG', slug: 'mg' },
];

const stats = [
  { value: '12,000+', label: 'Cars serviced' },
  { value: '4.9/5', label: 'Average rating' },
  { value: '24h', label: 'Avg. turnaround' },
  { value: '100%', label: 'Cashless billing' },
];

const painPoints = [
  { icon: Frown, title: 'No idea what was actually done', desc: 'Workshops hand back your car with a one-line invoice and a smile. You\'re left guessing what was replaced and why.' },
  { icon: DollarSign, title: 'Surprise bills, every visit', desc: 'You drop off for an oil change, get a call mid-service: "we found something else." Suddenly the bill doubles.' },
  { icon: AlertTriangle, title: 'Same problem, second visit', desc: 'Half the time the issue is back within a fortnight. No paper trail, no accountability, no recourse.' },
  { icon: XCircle, title: 'No transparency on parts', desc: 'OEM? Aftermarket? Refurbished? Most workshops won\'t tell you — and you\'re paying premium prices either way.' },
];

const services = [
  { icon: Wrench, name: 'Periodic Service', desc: 'Manufacturer-recommended oil, filters, fluids and 25-point inspection.', price: '₹2,499', span: 'lg:col-span-2' },
  { icon: Sparkles, name: 'Detailing & Coating', desc: 'Premium ceramic coating, paint correction.', price: '₹4,999' },
  { icon: Cog, name: 'Mechanical Repairs', desc: 'Suspension, transmission, brakes — done right.', price: 'On quote' },
  { icon: Gauge, name: 'Diagnostics', desc: 'OBD-II scan with detailed digital report.', price: '₹999' },
  { icon: ShieldCheck, name: 'Insurance Claims', desc: 'Cashless processing, end-to-end coordination.', price: 'Free' },
  { icon: Truck, name: 'Pickup & Drop', desc: 'Free doorstep pickup across Hyderabad. Service. Delivered.', price: 'Free in city', span: 'lg:col-span-2' },
];

const steps = [
  { icon: Calendar, title: 'Book your slot', desc: 'Pick services, slot, and pickup option in 60 seconds.', tag: '01' },
  { icon: Camera, title: 'Photo handover', desc: 'Every panel timestamped & geo-tagged before work begins.', tag: '02' },
  { icon: ClipboardCheck, title: 'Approve the quote', desc: 'See exactly what needs fixing. Approve item by item.', tag: '03' },
  { icon: Receipt, title: 'Pay & review', desc: 'GST invoice, secure pay link, one-tap rating.', tag: '04' },
];

const inclusions = [
  { icon: Camera, title: 'Time + GPS-stamped photos', desc: 'Every panel documented before any tool is picked up.' },
  { icon: ClipboardCheck, title: 'Itemised digital quote', desc: 'Approve or decline each item — no minimum approval needed.' },
  { icon: Receipt, title: 'GST-compliant invoice', desc: 'Sent on WhatsApp. Downloadable from your portal.' },
  { icon: ShieldCheck, title: '90-day work warranty', desc: 'On both labour and parts we install. No fine print.' },
  { icon: HeartHandshake, title: 'No-upsell promise', desc: 'We recommend the right service, not the most expensive one.' },
  { icon: Truck, title: 'Free pickup & drop', desc: 'Anywhere in Hyderabad. Outside city, transparent fee.' },
  { icon: MessageCircle, title: 'Real-time WhatsApp updates', desc: 'Status, photos, and the quote — pushed to your phone.' },
  { icon: Award, title: 'Certified technicians', desc: 'Every advisor and tech trained, badged, and accountable.' },
];

const valuePillars = [
  { icon: ShieldCheck, title: 'Manufacturer-grade parts', desc: 'OEM and OEM-equivalent parts only. Every batch traced. No grey-market shortcuts.' },
  { icon: Camera, title: 'Photo documentation', desc: 'Every job photographed and time-stamped. You see what we see, when we see it.' },
  { icon: HeartHandshake, title: 'No-upsell promise', desc: 'We recommend the right service for your car, not the most expensive one. Walk out at any time.' },
  { icon: Award, title: 'Certified technicians', desc: 'Every advisor and technician is trained, badged, and personally accountable for your job.' },
];

const productScreens = [
  { icon: Camera, title: 'Inspection photos', desc: 'Time- and location-stamped photos of every panel and component, viewable from the link sent to your phone.' },
  { icon: ClipboardCheck, title: 'Per-item approval', desc: 'Tick the services and parts you want done. Decline anything you don\'t. We start work only on what you approved.' },
  { icon: Receipt, title: 'Digital invoice', desc: 'GST-compliant, itemised, downloadable. Pay in-app via UPI, card, or bank transfer.' },
];

const coverageZones = [
  'Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Hitech City', 'Gachibowli', 'Kondapur',
  'Manikonda', 'Begumpet', 'Somajiguda', 'Punjagutta', 'Ameerpet', 'SR Nagar',
  'Kukatpally', 'Miyapur', 'Tellapur', 'Nallagandla',
];

const partners = [
  { label: 'HDFC ERGO', kind: 'Insurance' },
  { label: 'ICICI Lombard', kind: 'Insurance' },
  { label: 'Bajaj Allianz', kind: 'Insurance' },
  { label: 'Tata AIG', kind: 'Insurance' },
  { label: 'Bosch', kind: 'Parts' },
  { label: '3M', kind: 'Coatings' },
  { label: 'Mobil 1', kind: 'Lubricants' },
  { label: 'Castrol', kind: 'Lubricants' },
];

const testimonials = [
  { name: 'Rajesh Kumar', role: 'BMW 3 Series · Owner', quote: 'They sent photos of every scratch before starting work and called before doing anything extra. Most transparent workshop I have ever used.', rating: 5 },
  { name: 'Priya Sharma', role: 'Audi A4 · Owner', quote: 'Pickup at 9 AM, car back by 6 PM, full digital invoice on WhatsApp. Best service experience in 12 years of driving.', rating: 5 },
  { name: 'Amit Patel', role: 'Toyota Fortuner · Owner', quote: 'I could decline the items I did not want from the quote — that alone saved me ₹6,000. I will not go anywhere else.', rating: 5 },
  { name: 'Sneha Reddy', role: 'Hyundai Creta · Owner', quote: 'My car came back cleaner than I left it. The pickup driver was on time, and the WhatsApp updates were almost too good.', rating: 5 },
];

const faqs = [
  { q: 'How is Car Affair different from a regular workshop?', a: 'You get a digital paper trail of everything — timestamped photos, an itemised quote you can edit, real-time WhatsApp updates, and a GST-compliant invoice. Every job has a named advisor and named technician accountable for it.' },
  { q: 'Do you service all car brands?', a: 'Yes. Our technicians are trained on Indian, European, Japanese, and Korean brands — from Maruti and Hyundai to BMW, Mercedes, Audi, and Porsche. We use OEM-grade parts for every brand.' },
  { q: 'Is pickup & drop really free?', a: 'Yes, anywhere within Hyderabad city limits. Outside the city we charge a small distance fee that is shown to you before you confirm the booking.' },
  { q: 'What if I find a problem after the service?', a: 'Every service comes with a 90-day warranty on both labour and the parts we installed. If something goes wrong, we fix it free of cost — pickup included.' },
  { q: 'How long does a typical service take?', a: 'A periodic service is usually a same-day turnaround. Major repairs and detailing jobs take 1–3 days, and you get a clear ETA before we start.' },
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

export default function LandingPage() {
  return (
    <div className="px-5 sm:px-8 pt-6 pb-12 space-y-6">
      {/* ─────────── HERO ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-12 lg:p-16">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full bg-red-500/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-red-700/15 blur-3xl" />
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center mb-7">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-xs font-medium text-red-500 border border-red-500/25">
              <Sparkles className="h-3.5 w-3.5" /> Trusted by 12,000+ owners across Hyderabad
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="text-center font-bold leading-[0.95] tracking-tight text-[clamp(2.5rem,8.5vw,6.5rem)] text-[var(--text-primary)]"
          >
            Premium care.<br />
            <span className="gradient-text">Zero surprises.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-7 max-w-2xl mx-auto text-center text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed"
          >
            India&apos;s most transparent car workshop. Book online, watch your service unfold through real photos,
            approve only what you need, and get a clean digital invoice — without setting foot in the workshop.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/book" className="group sheen w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)] transition-all">
              Book a service
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/services" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-sm sm:text-base font-semibold glass-card hover:bg-[var(--bg-glass-hover)] text-[var(--text-primary)]">
              <PlayCircle className="h-4 w-4" /> See how it works
            </Link>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="relative mt-12 sm:mt-16 max-w-5xl mx-auto"
          >
            {/* Clean visual stage — real workshop photo */}
            <div className="relative aspect-[16/10] sm:aspect-[16/8] rounded-[1.75rem] overflow-hidden glass-card">
              <Image
                src="/hero-mechanic.png"
                alt="Car Affair technician inspecting a vehicle on the lift"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
              {/* Gradient wash for legibility of overlays + brand tint */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-br from-red-700/25 via-transparent to-red-900/20 mix-blend-multiply" />
              {/* Open badge */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full glass-panel flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-[var(--text-secondary)]">Workshop is open now</span>
              </div>
              {/* Caption pill */}
              <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-md">
                <div className="glass-panel px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Wrench className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Certified technician at work</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] truncate">Live inspection · Banjara Hills workshop</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature highlights — proper 4-col grid below the visual, no overlap risk */}
            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">Quote approved</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">5 of 7 items selected</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <Camera className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">Inspection photos</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">8 photos · GPS tagged</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">Live updates</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">WhatsApp + Email</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">4.9 rating</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">2,400+ reviews</p>
                </div>
              </motion.div>
            </div>

            {/* Stats strip */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="glass-card p-5 text-center">
                  <p className="text-2xl sm:text-3xl font-bold gradient-text">{s.value}</p>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1.5">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────── BRAND MARQUEE ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-card relative overflow-hidden py-7">
          <div className="text-center text-[10px] uppercase tracking-[0.25em] text-[var(--text-tertiary)] mb-5">
            Trusted by owners of every major brand
          </div>
          <div className="relative">
            <div className="flex animate-marquee whitespace-nowrap gap-3 sm:gap-4">
              {[...trustLogos, ...trustLogos, ...trustLogos].map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full glass-card flex-shrink-0"
                  title={b.name}
                >
                  <span className="relative w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden">
                    <Image
                      src={`/brands/${b.slug}.svg`}
                      alt={`${b.name} logo`}
                      width={32}
                      height={32}
                      className="object-contain p-1 dark:invert dark:brightness-200"
                      unoptimized
                    />
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">{b.name}</span>
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--bg-glass)] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--bg-glass)] to-transparent" />
          </div>
        </div>
      </section>

      {/* ─────────── PAIN POINTS ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">The workshop problem</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-[1.05]">
              Tired of these
              <br /><span className="gradient-text">workshop frustrations?</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              For decades, getting your car serviced has meant blind trust, surprise bills, and zero accountability.
              We built Car Affair to end that — with a process so transparent you&apos;ll wonder why no one did it sooner.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {painPoints.map((p, idx) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="glass-card p-6 flex gap-4">
                <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-red-500/20">
                  <p.icon className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{p.title}</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── SERVICES BENTO ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">What we do</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-[1.05]">
                Every service. <br /><span className="text-[var(--text-tertiary)]">One workshop.</span>
              </h2>
            </div>
            <p className="text-[var(--text-secondary)] max-w-md leading-relaxed">
              From a quick oil change to a full body restoration — every service handled in-house by certified
              technicians, with transparent pricing and a paper trail you can read.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {services.map((s, idx) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: idx * 0.05 }} className={'group sheen relative glass-card p-7 ' + (s.span ?? '')}>
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 flex items-center justify-center ring-1 ring-red-500/20">
                      <s.icon className="h-5 w-5 text-red-500" />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-tertiary)] glass-card px-2.5 py-1 rounded-full">From {s.price}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{s.name}</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mt-2 leading-relaxed">{s.desc}</p>
                  <Link href="/services" className="inline-flex items-center gap-1 mt-5 text-xs font-semibold text-red-500 group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── HOW IT WORKS ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight">Four steps. Zero guesswork.</h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              From first click to final invoice — designed to be the simplest workshop visit you have ever had.
            </p>
          </div>

          <div className="relative grid lg:grid-cols-4 gap-5 lg:gap-3">
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            {steps.map((step, idx) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }} className="relative">
                <div className="relative z-10 mx-auto mb-6 w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-[0_18px_40px_-12px_rgba(220,38,38,0.6)]">
                  <step.icon className="h-10 w-10 text-white" />
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full glass-card text-[10px] font-bold text-red-500">{step.tag}</span>
                </div>
                <h3 className="text-center text-lg font-semibold text-[var(--text-primary)]">{step.title}</h3>
                <p className="text-center text-sm text-[var(--text-tertiary)] mt-2 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── INCLUSIONS ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Always included</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight">
              What you get <span className="gradient-text">with every service.</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              No premium tier required. These are standard on every booking — from a ₹999 diagnostics check
              to a ₹50,000 full restoration.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {inclusions.map((it, idx) => (
              <motion.div key={it.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04 }} className="glass-card p-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center mb-4">
                  <it.icon className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{it.title}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-2 leading-relaxed">{it.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── VALUE PILLARS ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12 grid lg:grid-cols-5 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-2 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">The Car Affair difference</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-[1.05]">
              Built for owners <br /><span className="gradient-text">who care.</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We rebuilt the workshop experience from the ground up. Less mystery. More accountability.
              The result: an experience your car deserves and you actually enjoy.
            </p>
            <Link href="/about" className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-red-500 hover:gap-3 transition-all">
              About our story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {valuePillars.map((v, idx) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="glass-card p-6">
                <v.icon className="h-6 w-6 text-red-500 mb-4" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{v.title}</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-1.5 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── PRODUCT / APP PREVIEW ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="grid lg:grid-cols-5 gap-10 items-center">
            <div className="lg:col-span-2 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Your portal</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-[1.05]">
                Watch your service <br /><span className="gradient-text">in real time.</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                The moment we receive your car, your private customer portal lights up. Photos, status updates,
                the digital quote, and the final invoice — all in one place, always available.
              </p>
              <Link href="/book" className="sheen inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)]">
                Try it out <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-3 grid sm:grid-cols-3 gap-3">
              {productScreens.map((p, idx) => (
                <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="glass-card p-5 flex flex-col">
                  <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-red-500/15 via-transparent to-red-700/10 flex items-center justify-center mb-4 overflow-hidden">
                    <p.icon className="h-12 w-12 text-red-500/50" strokeWidth={1.2} />
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{p.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── COVERAGE & PARTNERS ─────────── */}
      <section className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center flex-shrink-0">
              <MapPinned className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Free pickup zones</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">Across all of Hyderabad.</h2>
            </div>
          </div>
          <p className="text-[var(--text-tertiary)] text-sm leading-relaxed mb-6">
            Free doorstep pickup &amp; drop in 16+ neighbourhoods. Don&apos;t see yours? Outside-zone pickup
            is available with a transparent distance fee shown at booking.
          </p>
          <div className="flex flex-wrap gap-2">
            {coverageZones.map((z) => (
              <span key={z} className="px-3 py-1.5 rounded-full glass-card text-xs text-[var(--text-secondary)]">
                {z}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-panel p-8 sm:p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Trusted partners</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">Insurance &amp; OEM-grade parts.</h2>
            </div>
          </div>
          <p className="text-[var(--text-tertiary)] text-sm leading-relaxed mb-6">
            Cashless insurance partners and OEM-grade parts &amp; lubricants from the brands you already trust.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {partners.map((p) => (
              <div key={p.label} className="glass-card p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{p.label}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{p.kind}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── TESTIMONIALS ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Loved by owners</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)]">What our customers say.</h2>
            <div className="flex items-center justify-center gap-1 mt-5">
              {[1, 2, 3, 4, 5].map((i) => (<Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />))}
              <span className="ml-2 text-sm font-semibold text-[var(--text-primary)]">4.9 / 5</span>
              <span className="text-sm text-[var(--text-tertiary)]">· based on 2,400+ reviews</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {testimonials.map((t, idx) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="relative glass-card p-6 flex flex-col">
                <Quote className="absolute top-5 right-5 h-8 w-8 text-red-500/15" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (<Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />))}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-[var(--border-glass)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{t.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] truncate">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── FAQ ─────────── */}
      <section className="max-w-4xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Common questions</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Everything you might be wondering.</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (<FaqItem key={f.q} q={f.q} a={f.a} />))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact" className="text-sm font-semibold text-red-500 hover:gap-2 inline-flex items-center gap-1 transition-all">
              Still have questions? Talk to us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-8 sm:p-14">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-red-500/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-red-700/20 blur-3xl pointer-events-none" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Ready when you are</p>
              <h2 className="text-3xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight">
                Give your car the care it deserves.
              </h2>
              <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
                Book your slot in 60 seconds. Free pickup &amp; drop across Hyderabad. No deposit. No commitment.
                Just transparent, honest car care.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  { icon: BadgeCheck, label: '90-day warranty' },
                  { icon: Trophy, label: 'Top-rated workshop' },
                  { icon: GraduationCap, label: 'Certified techs' },
                ].map((b) => (
                  <div key={b.label} className="glass-card px-3 py-2.5 flex items-center gap-2">
                    <b.icon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 lg:items-end">
              <Link href="/book" className="group sheen flex-1 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)] transition-all">
                Book a service <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="tel:+919999999999" className="flex-1 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold glass-card text-[var(--text-primary)]">
                <PhoneCall className="h-4 w-4" /> Talk to advisor
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
