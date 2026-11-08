const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      task TEXT NOT NULL,
      is_done BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, task, is_done FROM todos ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('GET /api/todos failed:', error);
    res.status(500).json({ error: '할 일 목록을 불러오지 못했습니다.' });
  }
});

app.post('/api/todos', async (req, res) => {
  const task = typeof req.body.task === 'string' ? req.body.task.trim() : '';

  if (!task) {
    return res.status(400).json({ error: '할 일 내용을 입력하세요.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO todos (task, is_done) VALUES ($1, FALSE) RETURNING id, task, is_done',
      [task]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('POST /api/todos failed:', error);
    res.status(500).json({ error: '할 일을 저장하지 못했습니다.' });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0 || typeof req.body.is_done !== 'boolean') {
    return res.status(400).json({ error: '잘못된 요청입니다.' });
  }

  try {
    const result = await pool.query(
      'UPDATE todos SET is_done = $1 WHERE id = $2 RETURNING id, task, is_done',
      [req.body.is_done, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없습니다.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('PATCH /api/todos/:id failed:', error);
    res.status(500).json({ error: '완료 상태를 변경하지 못했습니다.' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: '잘못된 ID입니다.' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없습니다.' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('DELETE /api/todos/:id failed:', error);
    res.status(500).json({ error: '할 일을 삭제하지 못했습니다.' });
  }
});

async function start() {
  try {
    await ensureSchema();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ToDo-Railway listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

start();
