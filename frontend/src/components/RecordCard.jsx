import { useRef, useState } from 'react';
import RecordForm from './RecordForm.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RecordCard({
  record,
  onUpdate,
  onDelete,
  onUploadFiles,
  onDeleteFile,
}) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    try {
      await onUploadFiles(record.id, files);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete "${record.title}" and all its files?`)) {
      onDelete(record.id);
    }
  };

  if (editing) {
    return (
      <div className="record-card">
        <RecordForm
          initial={record}
          onSubmit={async (data) => {
            await onUpdate(record.id, data);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="record-card">
      <div className="record-header">
        <h3 className="record-title">{record.title}</h3>
        <div className="record-actions">
          <button className="btn btn-sm btn-ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {record.notes && <p className="record-notes">{record.notes}</p>}

      <div className="record-meta">
        <span>{new Date(record.created_at).toLocaleDateString()}</span>
        {record.files?.length > 0 && <span> · {record.files.length} file(s)</span>}
      </div>

      {record.files?.length > 0 && (
        <ul className="file-list">
          {record.files.map((f) => (
            <li key={f.id} className="file-item">
              <a href={`/api/files/${f.id}/download`} className="file-link">
                📄 {f.filename}
              </a>
              <span className="file-size">{formatSize(f.size)}</span>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => onDeleteFile(f.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="upload-area">
        <input
          ref={fileInput}
          type="file"
          multiple
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-sm btn-outline"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : '📎 Attach Files'}
        </button>
      </div>
    </div>
  );
}
