import express from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { mkdirSync, unlinkSync } from 'fs';
import { initDb, getDb } from './db.js';

const PORT = process.env.PORT || 8000;
const DB_PATH = process.env.DB_PATH || './data/vault.db';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

mkdirSync(UPLOAD_DIR, { recursive: true });
initDb(DB_PATH);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, randomUUID()),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const app = express();
app.use(express.json());

// --- Records ---

app.get('/api/records', (req, res) => {
  const db = getDb();
  const records = db.prepare('SELECT * FROM records ORDER BY datetime(created_at) DESC').all();
  const result = records.map((r) => {
    const files = db
      .prepare('SELECT id, filename, mime_type, size FROM files WHERE record_id = ?')
      .all(r.id);
    return { ...r, files };
  });
  res.json(result);
});

app.post('/api/records', (req, res) => {
  const db = getDb();
  const { title, notes } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  const id = randomUUID();
  db.prepare('INSERT INTO records (id, title, notes) VALUES (?, ?, ?)').run(
    id,
    title.trim(),
    notes || ''
  );
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
  res.status(201).json({ ...record, files: [] });
});

app.put('/api/records/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Record not found' });
  const { title, notes } = req.body;
  db.prepare(
    "UPDATE records SET title = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(title ?? existing.title, notes ?? existing.notes, req.params.id);
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  const files = db
    .prepare('SELECT id, filename, mime_type, size FROM files WHERE record_id = ?')
    .all(req.params.id);
  res.json({ ...record, files });
});

app.delete('/api/records/:id', (req, res) => {
  const db = getDb();
  const files = db
    .prepare('SELECT storage_path FROM files WHERE record_id = ?')
    .all(req.params.id);
  files.forEach((f) => {
    try { unlinkSync(f.storage_path); } catch { /* file may already be gone */ }
  });
  db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// --- Files ---

app.post('/api/records/:id/files', upload.array('files', 10), (req, res) => {
  const db = getDb();
  const record = db.prepare('SELECT id FROM records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  const uploaded = (req.files || []).map((f) => {
    const id = randomUUID();
    db.prepare(
      'INSERT INTO files (id, record_id, filename, mime_type, size, storage_path) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.id, f.originalname, f.mimetype, f.size, f.path);
    return { id, filename: f.originalname, mime_type: f.mimetype, size: f.size };
  });
  res.status(201).json(uploaded);
});

app.get('/api/files/:id/download', (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  res.download(file.storage_path, file.filename);
});

app.delete('/api/files/:id', (req, res) => {
  const db = getDb();
  const file = db
    .prepare('SELECT storage_path FROM files WHERE id = ?')
    .get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  try { unlinkSync(file.storage_path); } catch { /* already gone */ }
  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.listen(PORT, '0.0.0.0', () =>
  console.log(`InkVault backend running on port ${PORT}`)
);
