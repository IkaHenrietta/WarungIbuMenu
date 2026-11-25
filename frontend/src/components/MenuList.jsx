import React from 'react';
import { LoaderCircle, Pencil, Plus, Search, ShoppingBag, Trash2, UtensilsCrossed } from 'lucide-react';
import { formatPrice } from '../lib/format';

export default function MenuList({
  items,
  query,
  onQueryChange,
  loading,
  error,
  onCreate,
  onAdd,
  onEdit,
  onDelete,
  isOwner
}) {
  return <main className="wrap main-content">
    <div className="section-heading">
      <div>
        <div className="eyebrow muted">FRESH FROM THE KITCHEN</div>
        <h2>Our menu<span className="accent-period">.</span></h2>
      </div>
      <button className="button button-outline new-post" onClick={onCreate}><Plus size={17} /> Add dish</button>
    </div>
    <div className="toolbar">
      <div className="search-box">
        <Search size={18} />
        <input value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Search dishes..." aria-label="Search dishes" />
      </div>
      <span className="story-count">
        {items.length}
        {" "}
        {items.length === 1 ? 'dish' : 'dishes'}
      </span>
    </div>
    {error && <div className="notice error">
      {error}
    </div>}
    {loading ? <div className="empty"><LoaderCircle className="spin" /> Loading menu...</div> : items.length === 0 ? <div className="empty">
      <UtensilsCrossed size={34} />
      <h3>
        {query ? 'No matching dishes' : 'The menu is empty'}
      </h3>
      <p>
        {query ? 'Try a different search.' : 'Add the first dish to get started.'}
      </p>
    </div> : <div className="post-grid">
      {items.map((item, index) => <div className="post-card dish-card" key={item.id}>
        <div className={`card-cover cover-${index % 4}`}>
          {item.image_url ? <img src={item.image_url} alt={item.name} /> : <div className="cover-decoration">
            <span>✦</span>
            <span>✳</span>
          </div>}
        </div>
        <div className="card-content">
          <div className="card-date">
            {item.category}
          </div>
          <h3>
            {item.name}
          </h3>
          <p>
            {item.description}
          </p>
          <div className="dish-footer">
            <span className="dish-price">
              {formatPrice(item.price)}
            </span>
            {item.is_available ? <button className="button button-dark button-small" onClick={() => onAdd(item)}><ShoppingBag size={15} /> Add to cart</button> : <span className="dish-unavailable">Unavailable</span>}
          </div>
          {isOwner(item) && <div className="dish-owner-actions">
            <button className="button button-outline button-small" onClick={() => onEdit(item)}><Pencil size={14} /> Edit</button>
            <button className="button button-outline button-small" onClick={() => onDelete(item)}><Trash2 size={14} /> Delete</button>
          </div>}
        </div>
      </div>)}
    </div>}
  </main>;
}