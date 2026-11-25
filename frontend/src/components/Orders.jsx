import React from 'react';
import { ClipboardList, LoaderCircle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { formatPrice } from '../lib/format';

const NEXT_STATUS = {
  pending: {
    status: 'preparing',
    label: 'Start preparing'
  },
  preparing: {
    status: 'completed',
    label: 'Mark completed'
  }
};

export default function Orders({
  session,
  onSignIn
}) {
  const [tab, setTab] = React.useState('mine');
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [busyId, setBusyId] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setOrders(await api(tab === 'mine' ? '/orders' : '/orders/incoming'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, session]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(order, status) {
    setBusyId(order.id);
    setError('');
    try {
      await api(`/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status
        })
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!session) {
    return <main className="wrap main-content">
      <div className="empty">
        <ClipboardList size={34} />
        <h3>Sign in to see your orders</h3>
        <p>Your order history is linked to your account.</p>
        <button className="button button-dark" onClick={onSignIn}>Sign in</button>
      </div>
    </main>;
  }

  return <main className="wrap main-content">
    <div className="section-heading">
      <div>
        <div className="eyebrow muted">ORDERS</div>
        <h2>{tab === 'mine' ? 'My orders' : 'Incoming orders'}<span className="accent-period">.</span></h2>
      </div>
      <button className="button button-outline new-post" onClick={load}><RefreshCw size={16} /> Refresh</button>
    </div>
    <div className="toolbar">
      <div className="tabs">
        <button className={tab === 'mine' ? 'tab active' : 'tab'} onClick={() => setTab('mine')}>My orders</button>
        <button className={tab === 'incoming' ? 'tab active' : 'tab'} onClick={() => setTab('incoming')}>Incoming (my dishes)</button>
      </div>
      <span className="story-count">
        {orders.length}
        {" "}
        {orders.length === 1 ? 'order' : 'orders'}
      </span>
    </div>
    {error && <div className="notice error">
      {error}
    </div>}
    {loading ? <div className="empty"><LoaderCircle className="spin" /> Loading orders...</div> : orders.length === 0 ? <div className="empty">
      <ClipboardList size={34} />
      <h3>{tab === 'mine' ? 'No orders yet' : 'No incoming orders'}</h3>
      <p>{tab === 'mine' ? 'Place an order from the menu and it will show up here.' : 'Orders for dishes you added will show up here.'}</p>
    </div> : <div className="order-list">
      {orders.map(order => {
        const next = NEXT_STATUS[order.status];
        const canCancelAsCustomer = tab === 'mine' && order.status === 'pending';
        const canCancelAsOwner = tab === 'incoming' && (order.status === 'pending' || order.status === 'preparing');
        return <div className="order-card" key={order.id}>
          <div className="order-top">
            <div>
              <strong>Order #{order.id.slice(0, 8)}</strong>
              <span className="order-date">
                {new Date(order.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <span className={`status status-${order.status}`}>{order.status}</span>
          </div>
          <ul className="order-items">
            {order.items.map((item, index) => <li key={index}>
              <span>{item.quantity} × {item.name}</span>
              <span>{formatPrice(item.unit_price * item.quantity)}</span>
            </li>)}
          </ul>
          {order.note && <p className="order-note">Note: {order.note}</p>}
          <div className="order-bottom">
            <strong>Total {formatPrice(order.total)}</strong>
            <div className="order-actions">
              {tab === 'incoming' && next && <button className="button button-dark button-small" disabled={busyId === order.id} onClick={() => updateStatus(order, next.status)}>{next.label}</button>}
              {(canCancelAsCustomer || canCancelAsOwner) && <button className="button button-outline button-small" disabled={busyId === order.id} onClick={() => {
                if (window.confirm('Cancel this order?')) updateStatus(order, 'cancelled');
              }}>Cancel order</button>}
            </div>
          </div>
        </div>;
      })}
    </div>}
  </main>;
}