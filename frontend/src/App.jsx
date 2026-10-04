import { useState, useEffect, useCallback } from 'react';
import RecordForm from './components/RecordForm.jsx';
import RecordCard from './components/RecordCard.jsx';

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/records');
      if (!res.ok) throw new Error('Failed to fetch records');
      setRecords(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCreate = async (data) => {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create record');
    setShowForm(false);
    fetchRecords();
  };

  const handleUpdate = async (id, data) => {
    const res = await fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update record');
    fetchRecords();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/records/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const handleUploadFiles = async (id, files) => {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));
    const res = await fetch(`/api/records/${id}/files`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    fetchRecords();
  };

  const handleDeleteFile = async (fileId) => {
    await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    fetchRecords();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔒 InkVault</h1>
        <p>Your private digital vault for personal records</p>
      </header>

      <main className="app-main">
        <div className="toolbar">
          <button
            className="btn btn-primary"
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? 'Cancel' : '+ New Record'}
          </button>
        </div>

        {showForm && (
          <RecordForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        )}

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p className="muted">Loading…</p>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <p>No records yet. Create your first record to get started.</p>
          </div>
        ) : (
          <div className="record-list">
            {records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onUploadFiles={handleUploadFiles}
                onDeleteFile={handleDeleteFile}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
