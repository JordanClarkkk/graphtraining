import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 15,
  title: 'Introspection & Tooling',
  level: 'advanced',
  description: 'Explore schemas at runtime and learn about the GraphQL ecosystem.',
};

const schema = `type User {
  "A unique identifier for the user"
  id: ID!
  "The user's display name"
  name: String!
  "The user's email address"
  email: String!
  "The user's role in the system"
  role: Role!
  "Posts authored by this user"
  posts: [Post!]!
}

enum Role {
  ADMIN
  MODERATOR
  USER
}

type Post {
  id: ID!
  title: String!
  body: String
  author: User!
  tags: [String!]!
  published: Boolean!
}

type Query {
  "Get the currently authenticated user"
  me: User
  "Find a user by their ID"
  user(id: ID!): User
  "List all users"
  users: [User!]!
  "Search posts by title"
  searchPosts(query: String!): [Post!]!
}

type Mutation {
  "Create a new post"
  createPost(title: String!, body: String, tags: [String!]): Post!
  "Publish an existing post"
  publishPost(id: ID!): Post
}`;

const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'USER' },
];
const posts = [
  { id: 'p1', title: 'Hello GraphQL', body: 'An intro to GraphQL', authorId: '1', tags: ['graphql', 'api'], published: true },
  { id: 'p2', title: 'Advanced Schemas', body: 'Schema design tips', authorId: '1', tags: ['graphql', 'schema'], published: false },
];

const resolvers = {
  Query: {
    me: () => users[0],
    user: (_, { id }) => users.find(u => u.id === id),
    users: () => users,
    searchPosts: (_, { query }) => posts.filter(p => p.title.toLowerCase().includes(query.toLowerCase())),
  },
  User: {
    posts: (user) => posts.filter(p => p.authorId === user.id),
  },
  Post: {
    author: (post) => users.find(u => u.id === post.authorId),
  },
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

export async function run() {
  await explainStep({
    title: 'Introspection — Schema Discovery',
    explanation: [
      'GraphQL schemas are self-describing. You can query the schema itself',
      'using introspection queries. This powers:',
      '  • GraphiQL and Playground IDEs',
      '  • Auto-completion in editors',
      '  • Code generation tools',
      '  • Documentation generators',
      '',
      'Special fields starting with __ are introspection fields:',
      '  __schema  — Get the full schema',
      '  __type    — Get details about a specific type',
      '  __typename — Get the type name of any object',
    ],
  });

  await queryPlayground({
    title: 'Exercise: List All Types',
    explanation: [
      'Use the __schema introspection query to list all types in the schema.',
      'This is what GraphiQL does when you open it!',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  __schema {
    types {
      name
      kind
    }
  }
}`,
    validate: (result) => {
      if (result.data?.__schema?.types?.length > 0) {
        return { pass: true, message: 'You can see all types! Note the built-in types (__Type, __Schema, etc.) alongside your custom types.' };
      }
      return { pass: false, message: 'Query __schema { types { name kind } }' };
    },
  });

  await queryPlayground({
    title: 'Exercise: Inspect a Type',
    explanation: [
      'Use __type to get detailed info about the User type.',
      'Get the field names, their types, and descriptions.',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  __type(name: "User") {
    name
    kind
    fields {
      name
      description
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}`,
    validate: (result) => {
      if (result.data?.__type?.fields?.length > 0) {
        return { pass: true, message: 'Full type inspection! Notice how non-null types show as NON_NULL with an ofType.' };
      }
      return { pass: false, message: 'Query __type(name: "User") with fields info.' };
    },
  });

  await queryPlayground({
    title: 'Exercise: __typename',
    explanation: [
      'Every object in GraphQL has a __typename field.',
      'This is useful for caching (Apollo Client uses it) and debugging.',
      'Query users and include __typename.',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  users {
    __typename
    name
    posts {
      __typename
      title
    }
  }
}`,
    validate: (result) => {
      if (result.data?.users?.[0]?.__typename === 'User') {
        return { pass: true, message: '__typename tells you the concrete type of each object. Apollo Client uses this for cache normalization!' };
      }
      return { pass: false, message: 'Add __typename to your user query.' };
    },
  });

  await explainStep({
    title: 'The GraphQL Ecosystem',
    explanation: [
      'Popular tools and libraries:',
      '',
      'Servers:',
      '  • Apollo Server (Node.js) — Most popular, full-featured',
      '  • graphql-yoga (Node.js)  — Lightweight, built on Envelop',
      '  • Strawberry (Python)     — Code-first Python server',
      '  • gqlgen (Go)             — Code-generated Go server',
      '',
      'Clients:',
      '  • Apollo Client   — React/Angular/Vue, caching, state management',
      '  • urql            — Lightweight, extensible React client',
      '  • Relay           — Facebook\'s client, optimized for performance',
      '  • graphql-request — Minimal client, just fetch + parse',
      '',
      'Tools:',
      '  • GraphQL Code Generator — Generate types from schema',
      '  • GraphiQL / Playground  — Interactive query IDEs',
      '  • Apollo Studio          — Schema registry, monitoring',
      '  • Hasura / PostGraphile  — Auto-generate API from database',
    ],
  });

  await explainStep({
    title: 'Disabling Introspection in Production',
    explanation: [
      'Important security note:',
      '',
      'Introspection should be DISABLED in production!',
      'It exposes your entire API structure to potential attackers.',
      '',
      'Enable it only in development and staging environments.',
    ],
    code: `// Apollo Server
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
});

// graphql-yoga
const yoga = createYoga({
  schema,
  graphiql: process.env.NODE_ENV !== 'production',
});`,
    language: 'graphql',
  });

  await quizStep({
    question: 'Why should introspection be disabled in production?',
    choices: [
      'It makes queries slower',
      'It uses too much memory',
      'It exposes your entire API structure to potential attackers',
      'It conflicts with query caching',
    ],
    answer: 'It exposes your entire API structure to potential attackers',
    successMessage: 'Right! Introspection reveals your full schema, which is a security risk in production.',
  });
}
