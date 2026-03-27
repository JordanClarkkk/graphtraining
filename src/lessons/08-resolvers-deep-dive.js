import { explainStep, quizStep, queryPlayground, fullPlayground } from '../engine/interactive.js';

export const meta = {
  id: 8,
  title: 'Resolvers Deep Dive',
  level: 'intermediate',
  description: 'Understand how resolvers work — the engine behind GraphQL execution.',
};

export async function run() {
  await explainStep({
    title: 'What are Resolvers?',
    explanation: [
      'Resolvers are functions that produce the data for each field in your schema.',
      'Every field in a schema maps to a resolver function.',
      '',
      'Resolver signature:',
      '  resolver(parent, args, context, info)',
      '',
      '  parent  — The result from the parent resolver (for nested fields)',
      '  args    — Arguments passed to the field',
      '  context — Shared context (auth, database connections, etc.)',
      '  info    — Query execution metadata (rarely used directly)',
    ],
  });

  await explainStep({
    title: 'Resolver Chain',
    explanation: [
      'GraphQL resolves queries top-down, field by field:',
    ],
    code: `# Schema
type Query {
  user(id: ID!): User
}
type User {
  name: String
  posts: [Post]
}
type Post {
  title: String
}

# Query
{ user(id: "1") { name posts { title } } }

# Execution order:
# 1. Query.user(parent=null, args={id:"1"})  → returns user object
# 2. User.name(parent=userObj, args={})       → returns "Alice"
# 3. User.posts(parent=userObj, args={})      → returns [post1, post2]
# 4. Post.title(parent=post1, args={})        → returns "Hello"
# 5. Post.title(parent=post2, args={})        → returns "World"`,
  });

  const schema1 = `type Query {
  user(id: ID!): User
}

type User {
  id: ID!
  firstName: String!
  lastName: String!
  fullName: String!
  email: String!
  posts: [Post!]!
  postCount: Int!
}

type Post {
  id: ID!
  title: String!
  body: String!
  wordCount: Int!
}`;

  const users = [
    { id: '1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
    { id: '2', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
  ];

  const posts = [
    { id: 'p1', title: 'GraphQL Basics', body: 'GraphQL is a query language for APIs', userId: '1' },
    { id: 'p2', title: 'Advanced Resolvers', body: 'Resolvers are the heart of a GraphQL server that processes each field', userId: '1' },
    { id: 'p3', title: 'Hello World', body: 'My first post', userId: '2' },
  ];

  const resolvers1 = {
    Query: {
      user: (_, { id }) => users.find(u => u.id === id),
    },
    User: {
      fullName: (parent) => `${parent.firstName} ${parent.lastName}`,
      posts: (parent) => posts.filter(p => p.userId === parent.id),
      postCount: (parent) => posts.filter(p => p.userId === parent.id).length,
    },
    Post: {
      wordCount: (parent) => parent.body.split(' ').length,
    },
  };

  await queryPlayground({
    title: 'Exercise: Computed Fields',
    explanation: [
      'This schema has computed/derived fields powered by resolvers:',
      '  • fullName = firstName + lastName',
      '  • postCount = number of user\'s posts',
      '  • wordCount = number of words in post body',
      '',
      'Query user "1" and get fullName, email, postCount, and their',
      'posts with title and wordCount.',
    ],
    schema: schema1,
    resolvers: resolvers1,
    defaultQuery: `{
  user(id: "1") {
    fullName
    email
    postCount
    posts {
      title
      wordCount
    }
  }
}`,
    validate: (result) => {
      const user = result.data?.user;
      if (user?.fullName && user?.postCount !== undefined && user?.posts?.[0]?.wordCount !== undefined) {
        return { pass: true, message: 'See how resolvers compute fullName, postCount, and wordCount on-the-fly!' };
      }
      return { pass: false, message: 'Include fullName, email, postCount, and posts { title wordCount }.' };
    },
  });

  await explainStep({
    title: 'The Context Argument',
    explanation: [
      'The context object is shared across ALL resolvers in a request.',
      'It\'s the perfect place for:',
      '  • Authentication info (current user)',
      '  • Database connections',
      '  • Data loaders',
      '  • Request-scoped caching',
    ],
    code: `// Server setup
const server = createServer({
  schema,
  context: ({ req }) => ({
    currentUser: authenticateUser(req.headers.authorization),
    db: databaseConnection,
    loaders: createDataLoaders(),
  }),
});

// In a resolver
const resolvers = {
  Query: {
    myProfile: (_, __, context) => {
      if (!context.currentUser) throw new Error('Not authenticated');
      return context.db.users.findById(context.currentUser.id);
    },
  },
};`,
  });

  await explainStep({
    title: 'Default Resolvers',
    explanation: [
      'You don\'t need to write a resolver for every field!',
      'GraphQL has a default resolver that does:',
      '',
      '  (parent, args) => parent[fieldName]',
      '',
      'So if your data object already has the right field names,',
      'the default resolver handles it automatically.',
      '',
      'Only write custom resolvers for:',
      '  • Computed/derived fields',
      '  • Fields that need database lookups',
      '  • Fields with different names than your data',
      '  • Fields that need transformation',
    ],
  });

  await quizStep({
    question: 'What are the four arguments a resolver function receives?',
    choices: [
      'query, variables, schema, types',
      'parent, args, context, info',
      'request, response, next, error',
      'data, errors, extensions, path',
    ],
    answer: 'parent, args, context, info',
    successMessage: 'Correct! parent (result from parent), args (field arguments), context (shared state), info (query metadata).',
  });

  await quizStep({
    question: 'When do you NOT need to write a custom resolver?',
    choices: [
      'When the field needs a database lookup',
      'When the field name matches the property name on the parent object',
      'When the field has arguments',
      'When the field returns a list',
    ],
    answer: 'When the field name matches the property name on the parent object',
    successMessage: 'Right! The default resolver automatically returns parent[fieldName].',
  });
}
