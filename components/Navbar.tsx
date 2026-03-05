'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Add New', href: '/books/new' },
  { label: 'Pricing', href: '/subscriptions' },
];

const Navbar = () => {
  const pathName = usePathname();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full fixed z-50 bg-[var(--bg-primary)]">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-0.5 items-center shrink-0">
          <Image src="/assets/logo.png" alt="BookGPT" width={42} height={26} />
          <span className="logo-text">BookGPT</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex w-fit gap-7.5 items-center">
          {navItems.map(({ label, href }) => {
            const isActive = pathName === href || (href !== '/' && pathName.startsWith(href));
            return (
              <Link
                href={href}
                key={label}
                className={cn('nav-link-base', isActive ? 'nav-link-active' : 'text-black hover:opacity-70')}
              >
                {label}
              </Link>
            );
          })}
          <div className="flex gap-7.5 items-center">
            <SignedOut>
              <SignInButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <div className="nav-user-link">
                <UserButton />
                {user?.firstName && (
                  <Link href="/subscriptions" className="nav-user-name">
                    {user.firstName}
                  </Link>
                )}
              </div>
            </SignedIn>
          </div>
        </nav>

        {/* Mobile: hamburger + auth */}
        <div className="flex md:hidden items-center gap-2">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="text-sm font-medium px-3 py-1.5 rounded-lg text-[#212a3b] hover:bg-[var(--bg-secondary)]"
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 rounded-lg text-[#212a3b] hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/20 top-[var(--navbar-height,80px)]"
            aria-label="Close menu"
          />
          <nav
            className={cn(
              'md:hidden fixed left-0 right-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] shadow-lg',
              'top-[var(--navbar-height,80px)] py-4 px-5'
            )}
          >
            <ul className="flex flex-col gap-1">
              {navItems.map(({ label, href }) => {
                const isActive = pathName === href || (href !== '/' && pathName.startsWith(href));
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block py-3 px-3 rounded-lg text-base font-medium transition-colors',
                        isActive
                          ? 'text-[var(--color-brand)] bg-[var(--bg-secondary)]'
                          : 'text-[#212a3b] hover:bg-[var(--bg-secondary)]'
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
};

export default Navbar;
