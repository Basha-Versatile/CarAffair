'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, MapPin, Phone, Send, MessageCircle, Clock, ArrowRight,
  Headphones, Wallet, Shield, Briefcase, AlertTriangle, Truck, MapPinned,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const channels = [
  { icon: Phone, title: 'Call us', subtitle: '+91 99999 99999', desc: 'Monday – Saturday · 9 AM – 7 PM', href: 'tel:+919999999999', accent: 'from-red-500 to-red-700' },
  { icon: MessageCircle, title: 'WhatsApp', subtitle: '+91 99999 99999', desc: 'Get a fast response from our advisor', href: 'https://wa.me/919999999999', accent: 'from-emerald-500 to-emerald-700' },
  { icon: Mail, title: 'Email us', subtitle: 'hello@caraffair.com', desc: 'For partnerships, claims & enterprise', href: 'mailto:hello@caraffair.com', accent: 'from-blue-500 to-blue-700' },
];

const departments = [
  { icon: Headphones, dept: 'Customer support', email: 'support@caraffair.com', phone: '+91 99999 99001', desc: 'Booking, status updates, general queries.' },
  { icon: Truck, dept: 'Pickup & drop', email: 'pickup@caraffair.com', phone: '+91 99999 99002', desc: 'Schedule, reschedule, or track your pickup.' },
  { icon: Wallet, dept: 'Billing & invoices', email: 'billing@caraffair.com', phone: '+91 99999 99003', desc: 'GST invoices, payment links, refunds.' },
  { icon: Shield, dept: 'Insurance & warranty', email: 'claims@caraffair.com', phone: '+91 99999 99004', desc: 'Claim filing, surveys, warranty work.' },
  { icon: Briefcase, dept: 'Partnerships', email: 'partners@caraffair.com', phone: '+91 99999 99005', desc: 'Fleet, corporate, supplier collaborations.' },
  { icon: MessageCircle, dept: 'Press & media', email: 'press@caraffair.com', phone: '+91 99999 99006', desc: 'Interviews, features, press kit.' },
];

const pickupZones = [
  'Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Hitech City', 'Gachibowli', 'Kondapur',
  'Manikonda', 'Begumpet', 'Somajiguda', 'Punjagutta', 'Ameerpet', 'SR Nagar',
  'Kukatpally', 'Miyapur', 'Tellapur', 'Nallagandla',
];

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.warning('Missing details', 'Name, email and message are required.');
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    toast.success('Message sent', 'We’ll get back to you within a business day.');
    setForm({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });
  };

  return (
    <div className="px-5 sm:px-8 pt-6 pb-12 space-y-6">
      {/* Hero */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel relative overflow-hidden p-8 sm:p-14 text-center">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-red-500/15 blur-3xl pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Contact</p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] leading-[0.95] tracking-tight">
            Talk to a
            <br />
            <span className="gradient-text">real human.</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-6 max-w-2xl mx-auto leading-relaxed">
            Questions about a service, pickup areas, or insurance claims? Drop us a note and a real
            advisor will get back to you within a business day. No bots. No menus.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-4">
          {channels.map((c, idx) => (
            <motion.a key={c.title} href={c.href} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} className="group sheen relative glass-card p-7 overflow-hidden">
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${c.accent} opacity-15 blur-2xl`} />
              <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${c.accent} flex items-center justify-center mb-5 ring-1 ring-black/10 dark:ring-white/15`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-base font-semibold text-[var(--text-primary)]">{c.title}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">{c.subtitle}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">{c.desc}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-red-500 group-hover:gap-2 transition-all">
                Reach out <ArrowRight className="h-3 w-3" />
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Form + map */}
      <section className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-3 glass-panel p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-2">Send a message</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">We&apos;d love to hear from you.</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">Fill in the form and a real advisor will reply within one business day.</p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input id="name" label="Full name" placeholder="Eswar Prasad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input id="email" type="email" label="Email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input id="phone" label="Phone" placeholder="+91 99999 99999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <div className="space-y-1.5">
                  <label htmlFor="subject" className="block text-sm font-medium text-[var(--text-secondary)]">Subject</label>
                  <select
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-card text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 [&>option]:bg-[var(--bg-secondary)] [&>option]:text-[var(--text-primary)]"
                  >
                    <option>General enquiry</option>
                    <option>Booking question</option>
                    <option>Pickup &amp; drop</option>
                    <option>Insurance claim</option>
                    <option>Billing</option>
                    <option>Partnerships</option>
                    <option>Press &amp; media</option>
                  </select>
                </div>
              </div>
              <Textarea id="message" label="Message" placeholder="What can we help with?" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <Button type="submit" className="w-full sheen" size="lg" isLoading={submitting} icon={!submitting ? <Send className="h-4 w-4" /> : undefined}>
                Send message
              </Button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }} className="lg:col-span-2 space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden glass-panel">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/15 via-transparent to-red-700/15" />
              <div className="absolute inset-0 text-[var(--text-primary)] opacity-[0.06] dark:opacity-[0.12]"
                style={{
                  backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 -z-10 w-32 h-32 rounded-full bg-red-500/30 blur-2xl animate-pulse" />
                  <MapPin className="h-12 w-12 text-red-500" />
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl glass-panel">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Car Affair Workshop</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Plot No. 42, Road No. 12, Banjara Hills</p>
              </div>
            </div>
            <div className="glass-card p-6">
              <Clock className="h-5 w-5 text-red-500 mb-3" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Workshop hours</p>
              <div className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between"><span>Mon – Fri</span><span>9:00 AM – 7:00 PM</span></div>
                <div className="flex justify-between"><span>Saturday</span><span>9:00 AM – 6:00 PM</span></div>
                <div className="flex justify-between"><span>Sunday</span><span className="text-red-500">Closed</span></div>
                <div className="flex justify-between pt-1.5 mt-1 border-t border-[var(--border-glass)]"><span className="font-semibold text-[var(--text-primary)]">Roadside assist</span><span className="text-emerald-500 font-semibold">24 / 7</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Department directory */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500 mb-3">Department directory</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
              Reach the right person, <span className="gradient-text">faster.</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
              Skip the wait. Email or call the team that handles your specific need.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d, idx) => (
              <motion.div key={d.dept} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04 }} className="glass-card p-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center mb-4">
                  <d.icon className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">{d.dept}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">{d.desc}</p>
                <div className="mt-4 pt-4 border-t border-[var(--border-glass)] space-y-1.5">
                  <a href={`mailto:${d.email}`} className="block text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors break-all">
                    <Mail className="h-3 w-3 inline mr-1.5" />{d.email}
                  </a>
                  <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="block text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                    <Phone className="h-3 w-3 inline mr-1.5" />{d.phone}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency strip + Coverage zones */}
      <section className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-panel relative overflow-hidden p-8 sm:p-10">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 ring-1 ring-red-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">24 / 7 emergency</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">Roadside assistance.</h2>
              </div>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
              Broke down? Stranded? Our roadside assistance team responds within 60 minutes across Hyderabad —
              jumpstart, flat tyre, towing, or fuel delivery.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <a href="tel:+919999999000" className="sheen inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_14px_30px_-10px_rgba(220,38,38,0.6)]">
                <Phone className="h-4 w-4" /> +91 99999 99000
              </a>
              <a href="https://wa.me/919999999000" className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold glass-card text-[var(--text-primary)]">
                <MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp SOS
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }} className="glass-panel p-8 sm:p-10">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center flex-shrink-0">
              <MapPinned className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Pickup zones</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">Free across Hyderabad.</h2>
            </div>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-5">
            Free pickup &amp; drop in 16+ neighbourhoods. Outside-zone pickup with a transparent fee shown
            upfront at booking.
          </p>
          <div className="flex flex-wrap gap-2">
            {pickupZones.map((z) => (
              <span key={z} className="px-3 py-1.5 rounded-full glass-card text-xs text-[var(--text-secondary)]">{z}</span>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
