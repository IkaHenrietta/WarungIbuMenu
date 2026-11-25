import React from 'react';
import { Check, LoaderCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { formatPrice } from '../lib/format';

export default function Cart({
  lines,
  session,
  onChangeQuantity,
  onRemove,
  onPlaced,
  onViewOrders,
  onSignIn,
  onClose
}) {
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [placed, setPlaced] = React.useState(null);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  async function checkout() {
    setBusy(true);
    setError('');
    try {
      const order = await api('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: lines.map(line => ({
            menu_item_id: line.id,
            quantity: line.quantity
          })),
          note: note.trim()
        })
      });
      setPlaced(order);
      onPlaced();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="drawer-backdrop" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <aside className="cart-drawer">
      <div className="cart-head">
        <div>
          <div className="eyebrow muted">YOUR ORDER</div>
          <h2>{placed ? 'Order placed' : 'Your cart'}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close cart">
          <X size={21} />
        </button>
      </div>

      {placed ? <div className="cart-done">
        <div className="cart-done-icon"><Check size={28} /></div>
        <h3>Thank you!</h3>
        <p>Your order total is <strong>{formatPrice(placed.total)}</strong>. Status: {placed.status}.</p>
        <button className="button button-dark" onClick={onViewOrders}>View my orders</button>
        <button className="button button-outline" onClick={onClose}>Keep browsing</button>
      </div> : lines.length === 0 ? <div className="cart-empty">
        <ShoppingBag size={34} />
        <h3>Your cart is empty</h3>
        <p>Add a few dishes from the menu to get started.</p>
        <button className="button button-dark" onClick={onClose}>Browse menu</button>
      </div> : <>
        <div className="cart-lines">
          {lines.map(line => <div className="cart-line" key={line.id}>
            <div className="cart-thumb">
              {line.image_url ? <img src={line.image_url} alt="" /> : <ShoppingBag size={20} />}
            </div>
            <div className="cart-info">
              <strong>{line.name}</strong>
              <span>{formatPrice(line.price)}</span>
              <div className="qty">
                <button onClick={() => onChangeQuantity(line.id, line.quantity - 1)} aria-label="Fewer">
                  <Minus size={14} />
                </button>
                <span>{line.quantity}</span>
                <button onClick={() => onChangeQuantity(line.id, line.quantity + 1)} aria-label="More" disabled={line.quantity >= 50}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="cart-line-end">
              <strong>{formatPrice(line.price * line.quantity)}</strong>
              <button className="icon-button" onClick={() => onRemove(line.id)} aria-label={`Remove ${line.name}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>)}
        </div>

        <div className="cart-foot">
          <label className="cart-note">Note for the kitchen (optional)
            <textarea value={note} maxLength={500} rows={2} onChange={event => setNote(event.target.value)} placeholder="No chili, extra sauce..." />
          </label>
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          {error && <div className="notice error">
            {error}
          </div>}
          {session ? <button className="button button-dark cart-checkout" disabled={busy} onClick={checkout}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}
            {" "}
            {busy ? 'Placing order...' : 'Place order'}
          </button> : <button className="button button-dark cart-checkout" onClick={onSignIn}>Sign in to place your order</button>}
          <p className="cart-hint">Prices are confirmed by the server when you place the order.</p>
        </div>
      </>}
    </aside>
  </div>;
}