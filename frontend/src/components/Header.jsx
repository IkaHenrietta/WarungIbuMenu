import React from 'react';
import { ArrowRight, ClipboardList, LogOut, ShoppingBag, Sparkles, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BRAND = 'freshbites';

export default function Header({
  session,
  view,
  cartCount,
  onHome,
  onMenu,
  onBlog,
  onOrders,
  onCart,
  onChat,
  onSignIn
}) {
  return <header className="site-header">
    <div className="header-inner">
      <a className="brand" href="#home" onClick={onHome}><span className="brand-mark">
          <UtensilsCrossed size={18} strokeWidth={2.2} />
        </span>{BRAND}<span className="brand-dot">.</span></a>
      <nav className="header-actions">
        <button className={view === 'menu' ? 'nav-link nav-keep active' : 'nav-link nav-keep'} onClick={onMenu}>Menu</button>
        <button className={view === 'orders' ? 'nav-link nav-keep active' : 'nav-link nav-keep'} onClick={onOrders}><ClipboardList size={15} /> Orders</button>
        <button className={view === 'blog' ? 'nav-link active' : 'nav-link'} onClick={onBlog}>Stories</button>
        <button className="nav-link nav-chat" onClick={onChat}><Sparkles size={15} /> Ask AI</button>
        <button className="nav-link nav-keep nav-cart" onClick={onCart}>
          <ShoppingBag size={16} /> Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
        {session ? <>
          <button className="avatar" title={session.user.email}>
            {session.user.email?.slice(0, 1).toUpperCase()}
          </button>
          <button className="icon-button logout" title="Sign out" onClick={() => supabase.auth.signOut()}>
            <LogOut size={18} />
          </button>
        </> : <button className="button button-small button-outline" onClick={onSignIn}>Sign in <ArrowRight size={15} /></button>}
      </nav>
    </div>
  </header>;
}