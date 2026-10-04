import { useState } from 'react';

export default function RecordForm({ onSubmit, onCancel, initial }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), notes: notes.trim() });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <input
        className="input"
        type="text"
        placeholder="Record title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        required
      />
      <textarea
        className="input textarea"
        placeholder="Add descriptive notes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
