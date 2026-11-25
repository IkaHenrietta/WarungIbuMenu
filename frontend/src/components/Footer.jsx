import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

const BRAND = 'freshbites';

export default function Footer() {
  return <footer className="footer">
    <div className="wrap footer-inner">
      <span className="brand footer-brand"><span className="brand-mark">
          <UtensilsCrossed size={14} strokeWidth={2.2} />
        </span>{BRAND}<span className="brand-dot">.</span></span>
      <span>Fresh food, ordered in a few taps.</span>
      <span>© {new Date().getFullYear()} {BRAND}</span>
    </div>
  </footer>;
}