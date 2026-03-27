import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 12,
  title: 'Performance & the N+1 Problem',
  level: 'advanced',
  description: 'Understand and solve the most common GraphQL performance problem.',
};

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

const schema = `type Author {
  id: ID!
  name: String!
}

type Post {
  id: ID!
  title: String!
  author: Author!
}

type BatchedPost {
  id: ID!
  title: String!
  author: Author!
}

type QueryStats {
  totalQueries: Int!
  log: [String!]!
}

type Query {
  # Naive approach (N+1 problem)
  posts: [Post!]!

  # Batched approach (DataLoader pattern)
  batchedPosts: [BatchedPost!]!

  # See how many "database queries" were made
  queryStats: QueryStats!
}`;

const resolvers = {
  Query: {
    posts: () => {
      queryLog = [];
      queryLog.push('SELECT * FROM posts');
      return posts;
    },
    batchedPosts: () => {
      queryLog = [];
      queryLog.push('SELECT * FROM posts');
      return posts.map(p => ({ ...p, _batched: true }));
    },
    queryStats: () => ({
      totalQueries: queryLog.length,
      log: queryLog,
    }),
  },
  Post: {
    author: (post) => {
      // Simulates N individual database lookups
      queryLog.push(`SELECT * FROM authors WHERE id = '${post.authorId}'`);
      return authors.find(a => a.id === post.authorId);
    },
  },
  BatchedPost: {
    author: (post) => {
      // Simulates a DataLoader batch — only logs once for the batch
      if (!queryLog.includes('SELECT * FROM authors WHERE id IN (...)')) {
        queryLog.push('SELECT * FROM authors WHERE id IN (...)');
      }
      return authors.find(a => a.id === post.authorId);
    },
  },
};

export async function run() {
  await explainStep({
    title: 'The N+1 Problem',
    explanation: [
      'The #1 performance problem in GraphQL (and ORMs in general).',
      '',
      'Imagine fetching 100 posts with their authors:',
      '',
      '  Query 1: SELECT * FROM posts              (1 query)',
      '  Query 2: SELECT * FROM authors WHERE id=1  (+1)',
      '  Query 3: SELECT * FROM authors WHERE id=2  (+1)',
      '  Query 4: SELECT * FROM authors WHERE id=3  (+1)',
      '  ...100 more individual author lookups       (+N)',
      '',
      '  Total: N+1 queries (1 for posts + N for each author)',
      '',
      'This happens because each Post.author resolver runs independently.',
    ],
  });

  await queryPlayground({
    title: 'Exercise: See the N+1 Problem',
    explanation: [
      'Query all posts with their author names.',
      'Then query queryStats to see how many "database queries" were made.',
      '',
      'With 5 posts, you\'d expect 1 query for posts + 5 for authors = 6 total.',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  posts {
    title
    author {
      name
    }
  }
  queryStats {
    totalQueries
    log
  }
}`,
    validate: (result) => {
      if (result.data?.queryStats?.totalQueries >= 6) {
        return { pass: true, message: `${result.data.queryStats.totalQueries} queries for 5 posts! That's the N+1 problem. Check the log to see each individual author lookup.` };
      }
      return { pass: false, message: 'Query posts { title author { name } } and queryStats { totalQueries log }.' };
    },
  });

  await explainStep({
    title: 'The Solution: DataLoader',
    explanation: [
      'DataLoader (by Facebook) batches and caches database lookups:',
      '',
      '  Instead of:',
      '    SELECT * FROM authors WHERE id = 1',
      '    SELECT * FROM authors WHERE id = 2',
      '    SELECT * FROM authors WHERE id = 3',
      '',
      '  DataLoader batches them into:',
      '    SELECT * FROM authors WHERE id IN (1, 2, 3)',
      '',
      '  1 query for posts + 1 batched query for authors = 2 total!',
    ],
    code: `import DataLoader from 'dataloader';

// Create a batch function
const authorLoader = new DataLoader(async (authorIds) => {
  // One query for ALL requested authors
  const authors = await db.query(
    'SELECT * FROM authors WHERE id IN (?)', [authorIds]
  );
  // Return in the same order as the input IDs
  return authorIds.map(id => authors.find(a => a.id === id));
});

// In the resolver — use the loader instead of direct DB access
const resolvers = {
  Post: {
    author: (post) => authorLoader.load(post.authorId),
    // DataLoader automatically batches calls within the same tick
  },
};`,
    language: 'graphql',
  });

  await queryPlayground({
    title: 'Exercise: Batched Queries',
    explanation: [
      'Now query batchedPosts (which simulates DataLoader batching).',
      'Compare the queryStats with the naive approach.',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  batchedPosts {
    title
    author {
      name
    }
  }
  queryStats {
    totalQueries
    log
  }
}`,
    validate: (result) => {
      if (result.data?.queryStats?.totalQueries === 2) {
        return { pass: true, message: 'Only 2 queries! DataLoader batched all author lookups into one query.' };
      }
      return { pass: false, message: 'Query batchedPosts with authors and check queryStats.' };
    },
  });

  await explainStep({
    title: 'Other Performance Tips',
    explanation: [
      '1. Query Complexity Analysis',
      '   → Assign costs to fields, reject queries exceeding a limit',
      '',
      '2. Depth Limiting',
      '   → Prevent deeply nested queries (max depth 10, for example)',
      '',
      '3. Persisted Queries',
      '   → Pre-register allowed queries, send only a hash at runtime',
      '',
      '4. Response Caching',
      '   → Cache at the field level using @cacheControl directive',
      '',
      '5. Automatic Persisted Queries (APQ)',
      '   → Client sends hash first, server asks for full query if not cached',
    ],
    code: `# Query complexity example
type Query {
  users(first: Int): [User]  # cost: first * 2
}

type User {
  posts: [Post]              # cost: 5 per user
}

# A query like:
# { users(first: 100) { posts { comments { author } } } }
# Could generate: 100 * (5 * (10 * 1)) = 5000 cost
# If max is 1000, this would be rejected!`,
  });

  await quizStep({
    question: 'What does DataLoader do to solve the N+1 problem?',
    choices: [
      'It caches all queries permanently',
      'It batches individual lookups into a single batch query',
      'It pre-fetches all data at server startup',
      'It limits the number of fields you can query',
    ],
    answer: 'It batches individual lookups into a single batch query',
    successMessage: 'Correct! DataLoader collects individual .load() calls and executes them as a single batch.',
  });
}
