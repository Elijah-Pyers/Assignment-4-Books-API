// tests/api.test.js
const request = require('supertest');
const createApp = require('../server');

describe('Books API', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    // ensure fresh seed data each test
    app.locals._state.reset();
  });

  test('GET /api/books should return all seeded books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(4);
    expect(res.body[0]).toHaveProperty('title');
  });

  test('GET /api/books/:id returns a specific book', async () => {
    const res = await request(app).get('/api/books/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('title', 'Dune');
  });

  test('GET /api/books/:id returns 404 when not found', async () => {
    const res = await request(app).get('/api/books/999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/books creates a new book', async () => {
    const payload = {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      year: 2008,
      genre: 'Tech',
      copiesAvailable: 5
    };
    const res = await request(app).post('/api/books').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Clean Code');

    // verify it was added
    const all = await request(app).get('/api/books');
    expect(all.body).toHaveLength(5);
  });

  test('POST /api/books validates required fields', async () => {
    const res = await request(app).post('/api/books').send({ author: 'No Title Author' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('PUT /api/books/:id updates an existing book (partial update allowed)', async () => {
    const res = await request(app)
      .put('/api/books/2')
      .send({ copiesAvailable: 7, genre: 'Science Fiction' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 2);
    expect(res.body.copiesAvailable).toBe(7);
    expect(res.body.genre).toBe('Science Fiction');
  });

  test('PUT /api/books/:id returns 404 when not found', async () => {
    const res = await request(app).put('/api/books/777').send({ title: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('PUT /api/books/:id validates bad types', async () => {
    const res = await request(app).put('/api/books/1').send({ year: 'not-an-int' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('DELETE /api/books/:id removes a book', async () => {
    const del = await request(app).delete('/api/books/3');
    expect(del.status).toBe(200);
    expect(del.body).toHaveProperty('message');

    const all = await request(app).get('/api/books');
    expect(all.body.find(b => b.id === 3)).toBeUndefined();
    expect(all.body).toHaveLength(3);
  });

  test('DELETE /api/books/:id returns 404 when not found', async () => {
    const res = await request(app).delete('/api/books/999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
