'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Phone, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppSelector } from '@/store/hooks';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function MarketingHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Customer pages must never expose admin URLs. Only customers see the My Account
  // link; admins/staff visiting marketing pages get a plain "Sign in" link.
  const isCustomer = user?.role === 'customer';
  const closeMenu = () => setOpen(false);

  return (
    <div className="sticky top-0 z-40">
      {/* Slim announcement strip */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-3">
          <div className="glass-card flex items-center justify-between px-4 py-1.5 text-[11px]">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Sparkles className="h-3 w-3 text-red-500" />
              Free pickup &amp; drop across Hyderabad · Mon – Sat · 9 AM – 7 PM
            </span>
            <a href="tel:+919999999999" className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-red-500 transition-colors">
              <Phone className="h-3 w-3 text-red-500" />
              +91 99999 99999
            </a>
          </div>
        </div>
      </div>

      {/* Main nav — glass capsule that floats over the bg */}
      <header className={cn('px-5 sm:px-8 pt-3 pb-3 transition-all', scrolled ? 'pt-2 pb-2' : 'pt-3 pb-3')}>
        <nav className={cn('max-w-7xl mx-auto glass-panel transition-all duration-300', scrolled ? '!rounded-2xl' : '!rounded-3xl')}>
          <div className="relative h-[68px] flex items-center justify-between px-5 sm:px-7">
            <Link href="/" className="flex items-center gap-2 group relative z-10">
              <Image
                src="/logo.png"
                alt="Car Affair"
                width={512}
                height={100}
                className="h-9 w-auto logo-adaptive transition-transform group-hover:scale-[1.04]"
                priority
              />
            </Link>

            <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {navItems.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2 rounded-full text-sm font-medium transition-all',
                      active
                        ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)]/70 backdrop-blur'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 relative z-10">
              <ThemeToggle />
              {isCustomer ? (
                <Link
                  href="/me"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium glass-card hover:bg-[var(--bg-glass-hover)]"
                >
                  My Account
                </Link>
              ) : (
                <Link
                  href="/me/login"
                  className="px-4 py-2.5 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/book"
                className="group sheen inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)] transition-all"
              >
                Book Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-2 relative z-10">
              <ThemeToggle compact />
              <button
                type="button"
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/60"
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {open && (
            <div className="md:hidden border-t border-[var(--border-glass)]">
              <div className="px-5 py-4 flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-xl text-base font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/60 hover:text-[var(--text-primary)]"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-3 mt-2 border-t border-[var(--border-glass)] flex flex-col gap-2">
                  {isCustomer ? (
                    <Link href="/me" onClick={closeMenu} className="px-4 py-3 rounded-xl text-sm font-medium text-center glass-card">
                      My Account
                    </Link>
                  ) : (
                    <Link href="/me/login" onClick={closeMenu} className="px-4 py-3 rounded-xl text-sm font-medium text-center glass-card">
                      Sign in
                    </Link>
                  )}
                  <Link
                    href="/book"
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-xl text-sm font-semibold text-white text-center bg-gradient-to-r from-red-600 to-red-700"
                  >
                    Book Now
                  </Link>
                  <a href="tel:+919999999999" onClick={closeMenu} className="mt-1 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <Phone className="h-3 w-3 text-red-500" /> +91 99999 99999
                  </a>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
    </div>
  );
}
