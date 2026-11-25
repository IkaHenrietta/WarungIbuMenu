import React from 'react';
import { Check, ImagePlus, LoaderCircle, X } from 'lucide-react';
import { api } from '../lib/api';

const CATEGORIES = ['Main', 'Starter', 'Dessert', 'Drinks', 'Sides'];

export default function MenuEditor({
  item,
  onClose,
  onSaved
}) {
  const [name, setName] = React.useState(item?.name || '');
  const [description, setDescription] = React.useState(item?.description || '');
  const [price, setPrice] = React.useState(item ? String(item.price) : '');
  const [category, setCategory] = React.useState(item?.category || 'Main');
  const [available, setAvailable] = React.useState(item ? item.is_available : true);
  const [image, setImage] = React.useState(null);
  const [removeImage, setRemoveImage] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const preview = React.useMemo(() => image ? URL.createObjectURL(image) : null, [image]);
  React.useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('description', description.trim());
      form.append('price', price);
      form.append('category', category.trim() || 'Main');
      form.append('is_available', available ? 'true' : 'false');
      if (image) form.append('image', image);
      if (removeImage) form.append('remove_existing_image', 'true');
      await api(item ? `/menu-items/${item.id}` : '/menu-items', {
        method: item ? 'PUT' : 'POST',
        body: form
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <div className="modal editor-modal">
      <div className="modal-head">
        <div>
          <div className="eyebrow muted">YOUR MENU</div>
          <h2>
            {item ? 'Edit dish' : 'Add a new dish'}
          </h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          <X size={21} />
        </button>
      </div>
      <form onSubmit={submit}>
        <label>Dish name<input value={name} maxLength={120} required onChange={event => setName(event.target.value)} placeholder="e.g. Nasi Lemak" /></label>
        <label>Description<textarea value={description} maxLength={2000} onChange={event => setDescription(event.target.value)} placeholder="What makes this dish special?" rows={4} /></label>
        <div className="form-row">
          <label>Price<input type="number" min="0" max="10000" step="0.01" required value={price} onChange={event => setPrice(event.target.value)} placeholder="8.50" /></label>
          <label>Category<input list="dish-categories" value={category} maxLength={60} required onChange={event => setCategory(event.target.value)} placeholder="Main" /></label>
        </div>
        <datalist id="dish-categories">
          {CATEGORIES.map(entry => <option key={entry} value={entry} />)}
        </datalist>
        <label className="check-label">
          <input type="checkbox" checked={available} onChange={event => setAvailable(event.target.checked)} />
          Available to order
        </label>
        <label className="image-label">Dish photo <span>Optional · PNG, JPG or WebP · max 5 MB</span></label>
        <label className="upload-box">
          {preview || item?.image_url && !removeImage ? <img src={preview || item.image_url} alt="Dish preview" /> : <>
            <ImagePlus size={25} />
            <span>Click to upload a photo</span>
          </>}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
            setImage(event.target.files?.[0] || null);
            setRemoveImage(false);
          }} />
        </label>
        {item?.image_url && !image && !removeImage && <button className="remove-image" type="button" onClick={() => setRemoveImage(true)}>Remove current photo</button>}
        {error && <div className="notice error">
          {error}
        </div>}
        <div className="modal-actions">
          <button className="button button-outline" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-dark" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}
            {" "}
            {busy ? 'Saving...' : item ? 'Save changes' : 'Add dish'}
          </button>
        </div>
      </form>
    </div>
  </div>;
}