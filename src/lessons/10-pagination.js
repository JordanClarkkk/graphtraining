import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 10,
  title: 'Pagination Patterns',
  level: 'advanced',
  description: 'Learn offset, cursor-based, and Relay-style pagination.',
};

const allPosts = Array.from({ length: 25 }, (_, i) => ({
  id: `post-${i + 1}`,
  title: `Post #${i + 1}: ${['GraphQL Tips', 'REST vs GraphQL', 'Schema Design', 'Performance', 'Testing'][i % 5]}`,
  author: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5],
  likes: Math.floor(Math.random() * 100) + 1,
  createdAt: `2024-01-${String(i + 1).padStart(2, '0')}`,
}));

const schema = `type Post {
  id: ID!
  title: String!
  author: String!
  likes: Int!
  createdAt: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
}

type Query {
  # Offset-based pagination
  postsOffset(limit: Int = 5, offset: Int = 0): [Post!]!

  # Cursor-based pagination (Relay-style)
  postsConnection(first: Int = 5, after: String): PostConnection!

  totalPosts: Int!
}`;

const resolvers = {
  Query: {
    postsOffset: (_, { limit, offset }) => {
      return allPosts.slice(offset, offset + limit);
    },
    postsConnection: (_, { first, after }) => {
      let startIndex = 0;
      if (after) {
        const afterIndex = allPosts.findIndex(p => Buffer.from(p.id).toString('base64') === after);
        startIndex = afterIndex + 1;
      }
      const slice = allPosts.slice(startIndex, startIndex + first);
      const edges = slice.map(post => ({
        node: post,
        cursor: Buffer.from(post.id).toString('base64'),
      }));
      return {
        edges,
        pageInfo: {
          hasNextPage: startIndex + first < allPosts.length,
          hasPreviousPage: startIndex > 0,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          totalCount: allPosts.length,
        },
      };
    },
    totalPosts: () => allPosts.length,
  },
};

export async function run() {
  await explainStep({
    title: 'Why Pagination?',
    explanation: [
      'Real APIs can have thousands or millions of records.',
      'Loading all at once is impractical. Pagination lets you:',
      '  • Load data in manageable chunks',
      '  • Reduce server load and response times',
      '  • Enable infinite scroll or page navigation',
      '',
      'GraphQL supports multiple pagination patterns:',
      '  1. Offset-based (simple, like SQL LIMIT/OFFSET)',
      '  2. Cursor-based (robust, handles real-time data)',
      '  3. Relay Connection spec (industry standard)',
    ],
  });

  await explainStep({
    title: '1. Offset-Based Pagination',
    explanation: [
      'The simplest approach — like SQL LIMIT and OFFSET:',
    ],
    code: `type Query {
  posts(limit: Int = 10, offset: Int = 0): [Post!]!
}

# Page 1: first 5 posts
{ posts(limit: 5, offset: 0) { title } }

# Page 2: next 5 posts
{ posts(limit: 5, offset: 5) { title } }

# Page 3: next 5 posts
{ posts(limit: 5, offset: 10) { title } }

# Problem: If items are inserted/deleted between requests,
# you might skip items or see duplicates!`,
  });

  await queryPlayground({
    title: 'Exercise: Offset Pagination',
    explanation: [
      'There are 25 posts total. Use offset pagination to fetch:',
      '  • Page 2 (posts 6-10): limit=5, offset=5',
      'Get the title and author for each post.',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  postsOffset(limit: 5, offset: 5) {
    title
    author
  }
  totalPosts
}`,
    validate: (result) => {
      const posts = result.data?.postsOffset;
      if (posts?.length === 5 && posts[0]?.title?.includes('#6')) {
        return { pass: true, message: 'Page 2 fetched! But offset pagination has pitfalls with real-time data...' };
      }
      return { pass: false, message: 'Use postsOffset(limit: 5, offset: 5) to get the second page.' };
    },
  });

  await explainStep({
    title: '2. Cursor-Based Pagination (Relay Connection)',
    explanation: [
      'The industry standard. Instead of offsets, you use opaque cursors:',
      '',
      '  • first: N — Get N items',
      '  • after: cursor — Start after this cursor',
      '  • Cursor = opaque string (usually base64-encoded ID)',
      '',
      'Advantages:',
      '  • Stable pagination even when data changes',
      '  • Works with real-time data (no skipped/duplicate items)',
      '  • Standard pattern supported by frameworks like Relay & Apollo',
    ],
    code: `type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
}

type PostEdge {
  node: Post!       # The actual data
  cursor: String!   # Opaque cursor for this item
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}`,
  });

  await queryPlayground({
    title: 'Exercise: Cursor Pagination — First Page',
    explanation: [
      'Fetch the first 3 posts using cursor-based pagination.',
      'Get the pageInfo to see if there\'s a next page.',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  postsConnection(first: 3) {
    edges {
      node {
        title
        author
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
      totalCount
    }
  }
}`,
    validate: (result) => {
      const conn = result.data?.postsConnection;
      if (conn?.edges?.length === 3 && conn?.pageInfo?.hasNextPage === true) {
        return { pass: true, message: 'First page loaded! Note the endCursor — you\'d pass it as "after" for the next page.' };
      }
      return { pass: false, message: 'Query postsConnection(first: 3) with edges and pageInfo.' };
    },
  });

  await queryPlayground({
    title: 'Exercise: Cursor Pagination — Next Page',
    explanation: [
      'Now fetch the NEXT page by passing the "after" cursor.',
      'Use the endCursor from the first page. It\'s the base64 of "post-3":',
      '  after: "cG9zdC0z"',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  postsConnection(first: 3, after: "cG9zdC0z") {
    edges {
      node {
        title
        author
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`,
    validate: (result) => {
      const edges = result.data?.postsConnection?.edges;
      if (edges?.length === 3 && edges[0]?.node?.title?.includes('#4')) {
        return { pass: true, message: 'Page 2 via cursor! This is the standard way to paginate in production GraphQL APIs.' };
      }
      return { pass: false, message: 'Pass after: "cG9zdC0z" to get the next page starting after post-3.' };
    },
  });

  await quizStep({
    question: 'Why is cursor-based pagination preferred over offset-based?',
    choices: [
      'Cursors are shorter to type',
      'Offset pagination can skip or duplicate items when data changes between requests',
      'Offset pagination doesn\'t work with GraphQL',
      'Cursor pagination is always faster',
    ],
    answer: 'Offset pagination can skip or duplicate items when data changes between requests',
    successMessage: 'Correct! Cursors give you stable pagination regardless of insertions/deletions.',
  });
}
