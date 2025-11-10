// Books for bookstore API
let books = [
    {
        id: 1,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Fiction",
        copiesAvailable: 5
    },
    {
        id: 2,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "Fiction",
        copiesAvailable: 3
    },
    {
        id: 3,
        title: "1984",
        author: "George Orwell",
        genre: "Dystopian Fiction",
        copiesAvailable: 7
    }
    // Add more books if you'd like!
];

/* Create your REST API here with the following endpoints:
    'GET /api/books': 'Get all books',
    'GET /api/books/:id': 'Get a specific book',
    'POST /api/books': 'Add a new book',
    'PUT /api/books/:id': 'Update a book',
    'DELETE /api/books/:id': 'Delete a book'
*/

// server.js
// Express.js REST API for a local library's books collection

const express = require('express');

/**
 * Factory so tests can create a fresh app (clean in-memory data each run)
 */
function createApp() {
  const app = express();
  const port = 3000;

  // ----- In-memory "database"
  let nextId = 5;
  let books = [
    { id: 1, title: 'Dune', author: 'Frank Herbert', year: 1965, genre: 'Sci-Fi', copiesAvailable: 3 },
    { id: 2, title: 'Dune Messiah', author: 'Frank Herbert', year: 1969, genre: 'Sci-Fi', copiesAvailable: 2 },
    { id: 3, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genre: 'Fantasy', copiesAvailable: 4 },
    { id: 4, title: 'The Pragmatic Programmer', author: 'Andrew Hunt; David Thomas', year: 1999, genre: 'Tech', copiesAvailable: 1 },
  ];

  // Expose helpers for tests (not part of public API)
  app.locals._state = {
    get books() { return books; },
    reset() {
      nextId = 5;
      books = [
        { id: 1, title: 'Dune', author: 'Frank Herbert', year: 1965, genre: 'Sci-Fi', copiesAvailable: 3 },
        { id: 2, title: 'Dune Messiah', author: 'Frank Herbert', year: 1969, genre: 'Sci-Fi', copiesAvailable: 2 },
        { id: 3, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genre: 'Fantasy', copiesAvailable: 4 },
        { id: 4, title: 'The Pragmatic Programmer', author: 'Andrew Hunt; David Thomas', year: 1999, genre: 'Tech', copiesAvailable: 1 },
      ];
    }
  };

  // ----- Middleware
  app.use(express.json());

  // ----- Root
  app.get('/', (_req, res) => {
    res.json({
      message: 'Welcome to the Library Books API',
      endpoints: {
        'GET /api/books': 'Get all books',
        'GET /api/books/:id': 'Get a specific book by ID',
        'POST /api/books': 'Create a new book',
        'PUT /api/books/:id': 'Update a book',
        'DELETE /api/books/:id': 'Delete a book'
      }
    });
  });

  // ----- Validation helper
  function validateBookPayload(body, { partial = false } = {}) {
    const required = ['title', 'author'];
    if (!partial) {
      for (const key of required) {
        if (!body || typeof body[key] !== 'string' || body[key].trim() === '') {
          return { ok: false, msg: `Field "${key}" is required and must be a non-empty string.` };
        }
      }
    }
    if (body.year !== undefined && !Number.isInteger(body.year)) {
      return { ok: false, msg: 'Field "year" must be an integer if provided.' };
    }
    if (body.copiesAvailable !== undefined && (!Number.isInteger(body.copiesAvailable) || body.copiesAvailable < 0)) {
      return { ok: false, msg: 'Field "copiesAvailable" must be a non-negative integer if provided.' };
    }
    return { ok: true };
  }

  // ----- GET: all books
  app.get('/api/books', (_req, res) => {
    res.json(books);
  });

  // ----- GET: book by ID
  app.get('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  });

  // ----- POST: create book
  app.post('/api/books', (req, res) => {
    const check = validateBookPayload(req.body, { partial: false });
    if (!check.ok) return res.status(400).json({ error: check.msg });

    const { title, author, year, genre, copiesAvailable = 0 } = req.body;
    const newBook = {
      id: nextId++,
      title,
      author,
      year: year ?? null,
      genre: genre ?? null,
      copiesAvailable
    };
    books.push(newBook);
    res.status(201).json(newBook);
  });

  // ----- PUT: update book
  app.put('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });

    const check = validateBookPayload(req.body, { partial: true });
    if (!check.ok) return res.status(400).json({ error: check.msg });

    // Replace fields if provided, keep existing otherwise
    const current = books[idx];
    const updated = {
      ...current,
      ...(req.body.title !== undefined ? { title: req.body.title } : {}),
      ...(req.body.author !== undefined ? { author: req.body.author } : {}),
      ...(req.body.year !== undefined ? { year: req.body.year } : {}),
      ...(req.body.genre !== undefined ? { genre: req.body.genre } : {}),
      ...(req.body.copiesAvailable !== undefined ? { copiesAvailable: req.body.copiesAvailable } : {}),
    };

    books[idx] = updated;
    res.json(updated);
  });

  // ----- DELETE: remove book
  app.delete('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });

    const deleted = books.splice(idx, 1)[0];
    res.json({ message: 'Book deleted successfully', book: deleted });
  });

  // ----- 404 for unknown routes
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Only start server when running directly (not during tests)
  if (require.main === module) {
    app.listen(port, () => {
      console.log(`Books API server running at http://localhost:${port}`);
    });
  }

  return app;
}

module.exports = createApp;

// If called directly: start server
if (require.main === module) {
  // createApp() called above already starts listening via the guard
}










