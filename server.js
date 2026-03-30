import express from 'express';
import { graphql, buildSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// In-memory state for lessons that mutate data
const lessonState = {};

function resetLessonState(lessonId) {
  switch (lessonId) {
    case 5:
      lessonState[5] = {
        todos: [
          { id: '1', text: 'Learn GraphQL basics', completed: true, createdAt: '2024-01-01' },
          { id: '2', text: 'Master mutations', completed: false, createdAt: '2024-01-02' },
          { id: '3', text: 'Build a real API', completed: false, createdAt: '2024-01-03' },
        ],
        nextId: 4,
      };
      break;
    default:
      break;
  }
}

// Execute a GraphQL query against a provided schema + resolvers
app.post('/api/execute', async (req, res) => {
  const { schemaSDL, query, variables, lessonId, exerciseId, resolverKey } = req.body;

  try {
    const resolvers = getResolvers(lessonId, exerciseId, resolverKey);
    let schema;

    if (resolvers && Object.keys(resolvers).length > 0) {
      schema = makeExecutableSchema({ typeDefs: schemaSDL, resolvers });
    } else {
      schema = buildSchema(schemaSDL);
    }

    const result = await graphql({
      schema,
      source: query,
      variableValues: variables || {},
    });

    res.json(result);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Reset lesson state
app.post('/api/reset-state', (req, res) => {
  const { lessonId } = req.body;
  resetLessonState(lessonId);
  res.json({ ok: true });
});

// Validate schema only
app.post('/api/validate-schema', (req, res) => {
  const { schemaSDL } = req.body;
  try {
    buildSchema(schemaSDL);
    res.json({ valid: true });
  } catch (err) {
    res.json({ valid: false, error: err.message });
  }
});

// Resolver library — maps lesson/exercise IDs to resolver functions
function getResolvers(lessonId, exerciseId, resolverKey) {
  const resolverMap = {
    // Lesson 1 — What is GraphQL
    '1:hello': {
      Query: { hello: () => 'Hello, World! Welcome to GraphQL!' },
    },

    // Lesson 2 — Schema & Types
    '2:books': {
      Query: {
        books: () => [
          { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925, rating: 4.2 },
          { id: '2', title: '1984', author: 'George Orwell', year: 1949, rating: 4.7 },
          { id: '3', title: 'To Kill a Mockingbird', author: 'Harper Lee', year: 1960, rating: 4.3 },
        ],
      },
    },

    // Lesson 3 — Queries & Fields
    '3:books': (() => {
      const authors = [
        { id: 'a1', name: 'F. Scott Fitzgerald', nationality: 'American' },
        { id: 'a2', name: 'George Orwell', nationality: 'British' },
        { id: 'a3', name: 'Gabriel Garcia Marquez', nationality: 'Colombian' },
      ];
      const books = [
        { id: '1', title: 'The Great Gatsby', authorId: 'a1', year: 1925, rating: 4.2, genre: 'Fiction' },
        { id: '2', title: '1984', authorId: 'a2', year: 1949, rating: 4.7, genre: 'Dystopian' },
        { id: '3', title: 'Animal Farm', authorId: 'a2', year: 1945, rating: 4.4, genre: 'Satire' },
        { id: '4', title: 'One Hundred Years of Solitude', authorId: 'a3', year: 1967, rating: 4.6, genre: 'Magic Realism' },
      ];
      return {
        Query: {
          books: () => books,
          book: (_, { id }) => books.find(b => b.id === id),
          author: (_, { id }) => authors.find(a => a.id === id),
          booksByGenre: (_, { genre }) => books.filter(b => b.genre.toLowerCase() === genre.toLowerCase()),
        },
        Book: { author: (book) => authors.find(a => a.id === book.authorId) },
        Author: { books: (author) => books.filter(b => b.authorId === author.id) },
      };
    })(),

    // Lesson 4 — Fragments & Variables
    '4:tasks': (() => {
      const users = [
        { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'Admin', department: 'Engineering' },
        { id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'Developer', department: 'Engineering' },
        { id: 'u3', name: 'Charlie', email: 'charlie@example.com', role: 'Designer', department: 'Design' },
      ];
      const tasks = [
        { id: 't1', title: 'Build login page', status: 'done', assigneeId: 'u2', priority: 'high' },
        { id: 't2', title: 'Design dashboard', status: 'in_progress', assigneeId: 'u3', priority: 'high' },
        { id: 't3', title: 'Fix API bug', status: 'todo', assigneeId: 'u2', priority: 'critical' },
        { id: 't4', title: 'Write tests', status: 'in_progress', assigneeId: 'u1', priority: 'medium' },
      ];
      return {
        Query: {
          users: () => users,
          user: (_, { id }) => users.find(u => u.id === id),
          tasks: (_, { status }) => status ? tasks.filter(t => t.status === status) : tasks,
          task: (_, { id }) => tasks.find(t => t.id === id),
        },
        Task: { assignee: (task) => users.find(u => u.id === task.assigneeId) },
      };
    })(),

    // Lesson 5 — Mutations
    '5:todos': (() => {
      if (!lessonState[5]) resetLessonState(5);
      return {
        Query: {
          todos: () => lessonState[5].todos,
          todo: (_, { id }) => lessonState[5].todos.find(t => t.id === id),
        },
        Mutation: {
          addTodo: (_, { text }) => {
            const todo = { id: String(lessonState[5].nextId++), text, completed: false, createdAt: new Date().toISOString().split('T')[0] };
            lessonState[5].todos.push(todo);
            return todo;
          },
          toggleTodo: (_, { id }) => {
            const todo = lessonState[5].todos.find(t => t.id === id);
            if (todo) todo.completed = !todo.completed;
            return todo;
          },
          deleteTodo: (_, { id }) => {
            const idx = lessonState[5].todos.findIndex(t => t.id === id);
            if (idx === -1) return null;
            return lessonState[5].todos.splice(idx, 1)[0];
          },
          updateTodo: (_, { id, text, completed }) => {
            const todo = lessonState[5].todos.find(t => t.id === id);
            if (!todo) return null;
            if (text !== undefined) todo.text = text;
            if (completed !== undefined) todo.completed = completed;
            return todo;
          },
        },
      };
    })(),

    // Lesson 6 — Enums, Interfaces & Unions
    '6:issues': (() => {
      const bugs = [
        { id: 'b1', createdAt: '2024-01-10', title: 'Login button broken', severity: 'CRITICAL', assignee: 'Alice', stepsToReproduce: 'Click login, see error' },
        { id: 'b2', createdAt: '2024-01-12', title: 'CSS misalignment on mobile', severity: 'LOW', assignee: null, stepsToReproduce: 'Open on iPhone' },
      ];
      const features = [
        { id: 'f1', createdAt: '2024-01-08', title: 'Dark mode', priority: 'HIGH', assignee: 'Bob', businessValue: 'User retention' },
        { id: 'f2', createdAt: '2024-01-15', title: 'Export to PDF', priority: 'MEDIUM', assignee: 'Charlie', businessValue: 'Enterprise clients' },
      ];
      const comments = [
        { id: 'c1', createdAt: '2024-01-11', body: 'This is blocking deployment', author: 'Alice' },
        { id: 'c2', createdAt: '2024-01-13', body: 'Dark mode would be great!', author: 'Dave' },
      ];
      const allItems = [...bugs, ...features, ...comments];
      const resolveType = (obj) => {
        if (obj.severity) return 'Bug';
        if (obj.businessValue) return 'Feature';
        return 'Comment';
      };
      return {
        Query: {
          issues: () => allItems,
          bugs: () => bugs,
          features: () => features,
          search: (_, { term }) => allItems.filter(i => (i.title || i.body || '').toLowerCase().includes(term.toLowerCase())),
          issuesByPriority: (_, { priority }) => [
            ...bugs.filter(b => b.severity === priority),
            ...features.filter(f => f.priority === priority),
          ],
        },
        Node: { __resolveType: resolveType },
        Assignable: { __resolveType: resolveType },
        SearchResult: { __resolveType: resolveType },
      };
    })(),

    // Lesson 7 — Directives
    '7:products': (() => {
      const manufacturers = [
        { name: 'TechCorp', country: 'USA', website: 'https://techcorp.example.com' },
        { name: 'GadgetWorld', country: 'Japan', website: 'https://gadgetworld.example.com' },
      ];
      const reviews = [
        { id: 'r1', rating: 5, comment: 'Amazing product!', author: 'Alice' },
        { id: 'r2', rating: 3, comment: null, author: 'Bob' },
        { id: 'r3', rating: 4, comment: 'Good value', author: 'Charlie' },
      ];
      const products = [
        { id: 'p1', name: 'Wireless Mouse', price: 29.99, description: 'Ergonomic design', inStock: true, reviews: [reviews[0], reviews[1]], manufacturer: manufacturers[0] },
        { id: 'p2', name: 'Mechanical Keyboard', price: 89.99, description: 'Cherry MX switches', inStock: false, reviews: [reviews[2]], manufacturer: manufacturers[1] },
        { id: 'p3', name: 'USB-C Hub', price: 49.99, description: null, inStock: true, reviews: [], manufacturer: manufacturers[0] },
      ];
      return {
        Query: {
          products: () => products,
          product: (_, { id }) => products.find(p => p.id === id),
        },
      };
    })(),

    // Lesson 8 — Resolvers Deep Dive
    '8:users': (() => {
      const users = [
        { id: '1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
        { id: '2', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
      ];
      const posts = [
        { id: 'p1', title: 'GraphQL Basics', body: 'GraphQL is a query language for APIs', userId: '1' },
        { id: 'p2', title: 'Advanced Resolvers', body: 'Resolvers are the heart of a GraphQL server that processes each field', userId: '1' },
        { id: 'p3', title: 'Hello World', body: 'My first post', userId: '2' },
      ];
      return {
        Query: { user: (_, { id }) => users.find(u => u.id === id) },
        User: {
          fullName: (p) => `${p.firstName} ${p.lastName}`,
          posts: (p) => posts.filter(post => post.userId === p.id),
          postCount: (p) => posts.filter(post => post.userId === p.id).length,
        },
        Post: { wordCount: (p) => p.body.split(' ').length },
      };
    })(),

    // Lesson 9 — Error Handling
    '9:users': (() => {
      const users = [
        { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin', salary: 95000 },
        { id: '2', name: 'Bob', email: 'bob@example.com', role: 'Developer', salary: 85000 },
      ];
      return {
        Query: {
          user: (_, { id }) => {
            const user = users.find(u => u.id === id);
            if (!user) throw new Error(`User with id "${id}" not found`);
            return user;
          },
          users: () => users,
        },
        User: {
          salary: () => { throw new Error('Access denied: salary is confidential'); },
          secretNotes: () => { throw new Error('Access denied: classified information'); },
        },
      };
    })(),

    // Lesson 10 — Pagination
    '10:posts': (() => {
      const allPosts = Array.from({ length: 25 }, (_, i) => ({
        id: `post-${i + 1}`,
        title: `Post #${i + 1}: ${['GraphQL Tips', 'REST vs GraphQL', 'Schema Design', 'Performance', 'Testing'][i % 5]}`,
        author: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5],
        likes: Math.floor(Math.random() * 100) + 1,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}`,
      }));
      return {
        Query: {
          postsOffset: (_, { limit = 5, offset = 0 }) => allPosts.slice(offset, offset + limit),
          postsConnection: (_, { first = 5, after }) => {
            let startIndex = 0;
            if (after) {
              const afterIndex = allPosts.findIndex(p => Buffer.from(p.id).toString('base64') === after);
              startIndex = afterIndex + 1;
            }
            const slice = allPosts.slice(startIndex, startIndex + first);
            const edges = slice.map(post => ({ node: post, cursor: Buffer.from(post.id).toString('base64') }));
            return {
              edges,
              pageInfo: {
                hasNextPage: startIndex + first < allPosts.length,
                hasPreviousPage: startIndex > 0,
                startCursor: edges[0]?.cursor || null,
                endCursor: edges[edges.length - 1]?.cursor || null,
                totalCount: allPosts.length,
              },
            };
          },
          totalPosts: () => allPosts.length,
        },
      };
    })(),

    // Lesson 11 — Auth
    '11:auth': (() => {
      const currentUser = { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'ADMIN', salary: 120000 };
      const users = [
        currentUser,
        { id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'USER', salary: 85000 },
        { id: 'u3', name: 'Charlie', email: 'charlie@example.com', role: 'USER', salary: 90000 },
      ];
      return {
        Query: {
          me: () => currentUser,
          users: () => users,
          user: (_, { id }) => {
            const user = users.find(u => u.id === id);
            if (!user) throw new Error('User not found');
            return user;
          },
        },
        User: {
          salary: (user) => {
            if (currentUser.role === 'ADMIN' || currentUser.id === user.id) return user.salary;
            throw new Error("Forbidden: Cannot view other users' salary");
          },
          email: (user) => {
            if (currentUser.role === 'ADMIN' || currentUser.id === user.id) return user.email;
            return `${user.email.split('@')[0][0]}***@${user.email.split('@')[1]}`;
          },
        },
        Mutation: {
          login: (_, { email }) => {
            const user = users.find(u => u.email === email);
            if (!user) throw new Error('Invalid credentials');
            return { token: 'jwt-token-' + user.id, user };
          },
          updateProfile: (_, { name, email }) => {
            if (name) currentUser.name = name;
            if (email) currentUser.email = email;
            return currentUser;
          },
        },
      };
    })(),

    // Lesson 12 — N+1 Problem
    '12:performance': (() => {
      let queryLog = [];
      const authors = [
        { id: 'a1', name: 'Alice Johnson' },
        { id: 'a2', name: 'Bob Smith' },
        { id: 'a3', name: 'Charlie Brown' },
      ];
      const posts = [
        { id: 'p1', title: 'GraphQL Basics', authorId: 'a1' },
        { id: 'p2', title: 'Advanced Queries', authorId: 'a1' },
        { id: 'p3', title: 'REST vs GraphQL', authorId: 'a2' },
        { id: 'p4', title: 'Schema Design', authorId: 'a2' },
        { id: 'p5', title: 'Performance Tips', authorId: 'a3' },
      ];
      return {
        Query: {
          posts: () => { queryLog = []; queryLog.push('SELECT * FROM posts'); return posts; },
          batchedPosts: () => { queryLog = []; queryLog.push('SELECT * FROM posts'); return posts.map(p => ({ ...p, _batched: true })); },
          queryStats: () => ({ totalQueries: queryLog.length, log: queryLog }),
        },
        Post: {
          author: (post) => { queryLog.push(`SELECT * FROM authors WHERE id = '${post.authorId}'`); return authors.find(a => a.id === post.authorId); },
        },
        BatchedPost: {
          author: (post) => {
            if (!queryLog.includes('SELECT * FROM authors WHERE id IN (...)')) queryLog.push('SELECT * FROM authors WHERE id IN (...)');
            return authors.find(a => a.id === post.authorId);
          },
        },
      };
    })(),

    // Lesson 13 — Subscriptions (chat data only)
    '13:chat': (() => {
      const chatUsers = [
        { id: 'u1', name: 'Alice', online: true },
        { id: 'u2', name: 'Bob', online: true },
        { id: 'u3', name: 'Charlie', online: false },
      ];
      const messages = [
        { id: 'm1', text: 'Hello everyone!', sender: chatUsers[0], channelId: 'ch1', createdAt: '2024-01-01T10:00:00Z' },
        { id: 'm2', text: 'Hey Alice!', sender: chatUsers[1], channelId: 'ch1', createdAt: '2024-01-01T10:01:00Z' },
        { id: 'm3', text: 'Working on the API', sender: chatUsers[0], channelId: 'ch2', createdAt: '2024-01-01T10:02:00Z' },
      ];
      const channels = [
        { id: 'ch1', name: 'general', messages: messages.filter(m => m.channelId === 'ch1'), members: chatUsers },
        { id: 'ch2', name: 'dev', messages: messages.filter(m => m.channelId === 'ch2'), members: [chatUsers[0], chatUsers[1]] },
      ];
      return {
        Query: {
          channel: (_, { id }) => channels.find(c => c.id === id),
          channels: () => channels,
        },
        Mutation: {
          sendMessage: (_, { channelId, text }) => {
            const msg = { id: `m${messages.length + 1}`, text, sender: chatUsers[0], channelId, createdAt: new Date().toISOString() };
            messages.push(msg);
            const ch = channels.find(c => c.id === channelId);
            if (ch) ch.messages.push(msg);
            return msg;
          },
        },
      };
    })(),

    // Lesson 14 — Schema Design
    '14:ecommerce': (() => {
      const products = [
        { id: 'prod1', name: 'Wireless Mouse', price: 29.99, inStock: true },
        { id: 'prod2', name: 'Keyboard', price: 89.99, inStock: true },
        { id: 'prod3', name: 'Monitor', price: 349.99, inStock: false },
      ];
      const orders = [
        {
          id: 'ord1',
          items: [
            { product: products[0], quantity: 1, subtotal: 29.99 },
            { product: products[1], quantity: 1, subtotal: 89.99 },
          ],
          status: 'DELIVERED', totalAmount: 119.98,
          shippingAddress: { street: '123 Main St', city: 'Springfield', state: 'IL', zip: '62701', country: 'US' },
          createdAt: '2024-01-15T10:30:00Z',
        },
      ];
      return {
        Query: {
          products: () => products,
          order: (_, { id }) => orders.find(o => o.id === id),
          myOrders: () => orders,
        },
        Mutation: {
          placeOrder: (_, { productIds, shippingAddress }) => {
            const orderProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean);
            const outOfStock = orderProducts.filter(p => !p.inStock);
            if (outOfStock.length > 0) {
              return { success: false, order: null, errors: outOfStock.map(p => `${p.name} is out of stock`) };
            }
            const items = orderProducts.map(p => ({ product: p, quantity: 1, subtotal: p.price }));
            const order = {
              id: 'ord' + (orders.length + 1), items, status: 'PENDING',
              totalAmount: items.reduce((sum, i) => sum + i.subtotal, 0),
              shippingAddress, createdAt: new Date().toISOString(),
            };
            orders.push(order);
            return { success: true, order, errors: [] };
          },
        },
      };
    })(),

    // Lesson 15 — Introspection
    '15:blog': (() => {
      const users = [
        { id: '1', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' },
        { id: '2', name: 'Bob', email: 'bob@example.com', role: 'USER' },
      ];
      const posts = [
        { id: 'p1', title: 'Hello GraphQL', body: 'An intro to GraphQL', authorId: '1', tags: ['graphql', 'api'], published: true },
        { id: 'p2', title: 'Advanced Schemas', body: 'Schema design tips', authorId: '1', tags: ['graphql', 'schema'], published: false },
      ];
      return {
        Query: {
          me: () => users[0],
          user: (_, { id }) => users.find(u => u.id === id),
          users: () => users,
          searchPosts: (_, { query }) => posts.filter(p => p.title.toLowerCase().includes(query.toLowerCase())),
        },
        User: { posts: (user) => posts.filter(p => p.authorId === user.id) },
        Post: { author: (post) => users.find(u => u.id === post.authorId) },
        Mutation: {
          createPost: (_, { title, body, tags }) => {
            const post = { id: `p${posts.length + 1}`, title, body: body || '', authorId: '1', tags: tags || [], published: false };
            posts.push(post);
            return post;
          },
          publishPost: (_, { id }) => {
            const post = posts.find(p => p.id === id);
            if (post) post.published = true;
            return post;
          },
        },
      };
    })(),
  };

  return resolverMap[resolverKey] || {};
}

app.listen(PORT, () => {
  console.log(`\n  🚀 GraphQL Trainer running at http://localhost:${PORT}\n`);
});
