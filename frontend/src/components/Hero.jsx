import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero({
  onBrowse,
  onChat
}) {
  return <section className="hero">
    <div className="wrap hero-inner">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> ORDER ONLINE</div>
        <h1>Fresh food, <em>made for you.</em></h1>
        <p>Browse the menu, add your favourites to the cart and place your order in a few taps. Hungry? Start with today's dishes.</p>
        <div className="hero-buttons">
          <button className="button button-dark" onClick={onBrowse}>Browse menu <ArrowRight size={18} /></button>
          <button className="button button-plain" onClick={onChat}><Sparkles size={17} /> Ask AI</button>
        </div>
      </div>
      <div className="hero-art food-art" aria-hidden="true">
        <svg viewBox="0 0 400 370" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="foodSun" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#60a5fa" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="185" r="168" fill="#dbeafe" stroke="#bfd3f5" />
          <circle cx="200" cy="185" r="124" fill="#eaf2ff" />
          <circle cx="332" cy="78" r="30" fill="url(#foodSun)" opacity="0.9" />
          <circle cx="62" cy="268" r="12" fill="#93c5fd" />
          <circle cx="352" cy="286" r="8" fill="#60a5fa" />
          <g className="steam" fill="none" stroke="#93c5fd" strokeWidth="5" strokeLinecap="round">
            <path d="M168 120 q-12 -18 0 -34 t0 -34" />
            <path d="M200 108 q-12 -18 0 -34 t0 -34" />
            <path d="M232 120 q-12 -18 0 -34 t0 -34" />
          </g>
          <ellipse cx="200" cy="268" rx="132" ry="14" fill="#1d4ed8" opacity="0.12" />
          <ellipse cx="200" cy="236" rx="142" ry="50" fill="#ffffff" />
          <ellipse cx="200" cy="232" rx="116" ry="36" fill="#f4f8ff" stroke="#dbe5f5" />
          <path d="M132 226 Q200 118 268 226 Q200 252 132 226 Z" fill="#fffdf7" stroke="#e6dfca" strokeWidth="2" />
          <ellipse cx="200" cy="236" rx="30" ry="9" fill="#c2410c" />
          <ellipse cx="294" cy="224" rx="24" ry="15" fill="#ffffff" stroke="#e5e7eb" />
          <circle cx="294" cy="224" r="8" fill="#f5b942" />
          <ellipse cx="106" cy="226" rx="24" ry="15" fill="#ffffff" stroke="#e5e7eb" />
          <circle cx="106" cy="226" r="8" fill="#f5b942" />
          <g fill="#86c98a" stroke="#5aa468">
            <circle cx="150" cy="250" r="12" />
            <circle cx="176" cy="256" r="12" />
            <circle cx="224" cy="256" r="12" />
            <circle cx="250" cy="250" r="12" />
          </g>
          <g fill="#c7ecc9">
            <circle cx="150" cy="250" r="6" />
            <circle cx="176" cy="256" r="6" />
            <circle cx="224" cy="256" r="6" />
            <circle cx="250" cy="250" r="6" />
          </g>
          <g fill="#a16207">
            <circle cx="166" cy="224" r="4" />
            <circle cx="236" cy="222" r="4" />
            <circle cx="214" cy="244" r="3.5" />
            <circle cx="188" cy="246" r="3.5" />
          </g>
          <text x="48" y="104" fontSize="44" fill="#2563eb">✳</text>
        </svg>
      </div>
    </div>
  </section>;
}