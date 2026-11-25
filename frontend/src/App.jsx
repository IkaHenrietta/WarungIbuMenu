import React from 'react';
import { Sparkles } from 'lucide-react';
import { api } from './lib/api';
import { useSession } from './hooks/useSession';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import Editor from './components/Editor';
import Auth from './components/Auth';
import Chat from './components/Chat';
import MenuList from './components/MenuList';
import MenuEditor from './components/MenuEditor';
import Cart from './components/Cart';
import Orders from './components/Orders';
import './food-theme.css';

export default function App() {
  const session = useSession();
  const [view, setView] = React.useState('menu');

  // Blog (original code)
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [editor, setEditor] = React.useState(null);
  const [selected, setSelected] = React.useState(null);

  // Menu
  const [items, setItems] = React.useState([]);
  const [menuLoading, setMenuLoading] = React.useState(true);
  const [menuError, setMenuError] = React.useState('');
  const [menuQuery, setMenuQuery] = React.useState('');
  const [dishEditor, setDishEditor] = React.useState(null);

  // Cart
  const [cart, setCart] = React.useState([]);
  const [cartOpen, setCartOpen] = React.useState(false);

  // Dialogs
  const [chatOpen, setChatOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);

  async function refresh() {
    try {
      setPosts(await api('/posts'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshMenu() {
    try {
      setItems(await api('/menu-items'));
      setMenuError('');
    } catch (err) {
      setMenuError(err.message);
    } finally {
      setMenuLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    refreshMenu();
  }, []);

  const visible = posts.filter(p => `${p.title} ${p.body}`.toLowerCase().includes(query.toLowerCase()));
  const visibleItems = items.filter(i => `${i.name} ${i.description} ${i.category}`.toLowerCase().includes(menuQuery.toLowerCase()));
  const mine = post => session?.user?.id === post.author_id;
  const isDishOwner = item => session?.user?.id === item.owner_id;
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const openCreate = () => session ? setEditor({}) : setAuthOpen(true);
  const openCreateDish = () => session ? setDishEditor({}) : setAuthOpen(true);

  async function remove(post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    try {
      await api(`/posts/${post.id}`, {
        method: 'DELETE'
      });
      setSelected(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeDish(item) {
    if (!window.confirm(`Delete “${item.name}” from the menu? This cannot be undone.`)) return;
    try {
      await api(`/menu-items/${item.id}`, {
        method: 'DELETE'
      });
      setCart(current => current.filter(line => line.id !== item.id));
      await refreshMenu();
    } catch (err) {
      setMenuError(err.message);
    }
  }

  function addToCart(item) {
    setCart(current => {
      const existing = current.find(line => line.id === item.id);
      if (existing) {
        return current.map(line => line.id === item.id ? {
          ...line,
          quantity: Math.min(50, line.quantity + 1)
        } : line);
      }
      return [...current, {
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        quantity: 1
      }];
    });
  }

  function changeQuantity(id, quantity) {
    if (quantity < 1) {
      setCart(current => current.filter(line => line.id !== id));
      return;
    }
    setCart(current => current.map(line => line.id === id ? {
      ...line,
      quantity: Math.min(50, quantity)
    } : line));
  }

  function browseMenu() {
    document.getElementById('menu')?.scrollIntoView({
      behavior: 'smooth'
    });
  }

  return <div className="app">
    <Header session={session} view={view} cartCount={cartCount} onHome={() => {
      setView('menu');
      setSelected(null);
    }} onMenu={() => {
      setView('menu');
      setSelected(null);
    }} onBlog={() => {
      setView('blog');
      setSelected(null);
      setChatOpen(false);
    }} onOrders={() => setView('orders')} onCart={() => setCartOpen(true)} onChat={() => setChatOpen(true)} onSignIn={() => setAuthOpen(true)} />

    {view === 'orders' ? <Orders session={session} onSignIn={() => setAuthOpen(true)} /> : view === 'blog' ? selected ? <PostDetail post={selected} isOwner={mine(selected)} onBack={() => setSelected(null)} onChat={() => setChatOpen(true)} onEdit={() => setEditor(selected)} onDelete={() => remove(selected)} /> : <PostList posts={visible} query={query} onQueryChange={setQuery} loading={loading} error={error} onCreate={openCreate} onSelect={setSelected} /> : <>
      <Hero onBrowse={browseMenu} onChat={() => setChatOpen(true)} />
      <div id="menu">
        <MenuList items={visibleItems} query={menuQuery} onQueryChange={setMenuQuery} loading={menuLoading} error={menuError} onCreate={openCreateDish} onAdd={addToCart} onEdit={setDishEditor} onDelete={removeDish} isOwner={isDishOwner} />
      </div>
    </>}

    <Footer />
    <button className="chat-fab" title="Ask AI" onClick={() => setChatOpen(true)}>
      <Sparkles size={22} />
    </button>

    {editor && <Editor post={editor.id ? editor : null} onClose={() => setEditor(null)} onSaved={async () => {
      setEditor(null);
      setSelected(null);
      await refresh();
    }} />}
    {dishEditor && <MenuEditor item={dishEditor.id ? dishEditor : null} onClose={() => setDishEditor(null)} onSaved={async () => {
      setDishEditor(null);
      await refreshMenu();
    }} />}
    {cartOpen && <Cart lines={cart} session={session} onChangeQuantity={changeQuantity} onRemove={id => setCart(current => current.filter(line => line.id !== id))} onPlaced={() => setCart([])} onViewOrders={() => {
      setCartOpen(false);
      setView('orders');
    }} onSignIn={() => {
      setCartOpen(false);
      setAuthOpen(true);
    }} onClose={() => setCartOpen(false)} />}
    {authOpen && <Auth onClose={() => setAuthOpen(false)} />}
    {chatOpen && <Chat session={session} onClose={() => setChatOpen(false)} onSignIn={() => {
      setChatOpen(false);
      setAuthOpen(true);
    }} onOpenPost={async id => {
      try {
        const post = posts.find(p => p.id === id) || (await api(`/posts/${id}`));
        setSelected(post);
        setView('blog');
        setChatOpen(false);
      } catch (err) {
        setError(err.message);
      }
    }} />}
  </div>;
}