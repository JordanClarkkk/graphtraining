import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 11,
  title: 'Authentication & Authorization',
  level: 'advanced',
  description: 'Secure your GraphQL API — auth patterns and best practices.',
};

const currentUser = { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' };

const users = [
  { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'ADMIN', salary: 120000 },
  { id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'USER', salary: 85000 },
  { id: 'u3', name: 'Charlie', email: 'charlie@example.com', role: 'USER', salary: 90000 },
];

const schema = `enum Role {
  USER
  ADMIN
  MODERATOR
}

type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  salary: Float
}

type AuthPayload {
  token: String!
  user: User!
}

type Query {
  me: User
  users: [User!]!
  user(id: ID!): User
}

type Mutation {
  login(email: String!, password: String!): AuthPayload!
  updateProfile(name: String, email: String): User!
}`;

const resolvers = {
  Query: {
    me: () => currentUser,
    users: () => {
      if (currentUser.role !== 'ADMIN') throw new Error('Forbidden: Admin access required');
      return users;
    },
    user: (_, { id }) => {
      const user = users.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    },
  },
  User: {
    salary: (user) => {
      // Only admins or the user themselves can see salary
      if (currentUser.role === 'ADMIN' || currentUser.id === user.id) {
        return user.salary;
      }
      throw new Error('Forbidden: Cannot view other users\' salary');
    },
    email: (user) => {
      // Users can see their own email, admins can see all
      if (currentUser.role === 'ADMIN' || currentUser.id === user.id) {
        return user.email;
      }
      return `${user.email.split('@')[0][0]}***@${user.email.split('@')[1]}`;
    },
  },
  Mutation: {
    login: (_, { email, password }) => {
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

export async function run() {
  await explainStep({
    title: 'Authentication vs Authorization',
    explanation: [
      'Two distinct concerns:',
      '',
      '  Authentication (AuthN) — WHO are you?',
      '    → Logging in, verifying identity (JWT, session, API key)',
      '',
      '  Authorization (AuthZ) — WHAT can you do?',
      '    → Checking permissions (roles, scopes, ownership)',
      '',
      'GraphQL handles these in the resolver layer, NOT the transport layer.',
    ],
  });

  await explainStep({
    title: 'Authentication Pattern',
    code: `// Server setup — extract user from token in context
const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    const token = req.headers.authorization || '';
    const user = verifyToken(token);  // Your auth logic
    return { currentUser: user };
  },
});

// Resolver — use context to check auth
const resolvers = {
  Query: {
    me: (_, __, { currentUser }) => {
      if (!currentUser) throw new AuthenticationError('Must be logged in');
      return currentUser;
    },
  },
};`,
    language: 'graphql',
  });

  await queryPlayground({
    title: 'Exercise: The "me" Query',
    explanation: [
      'The "me" query returns the currently authenticated user.',
      'In this sandbox, you\'re logged in as Alice (ADMIN).',
      'Query your own profile: name, email, role, and salary.',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  me {
    name
    email
    role
    salary
  }
}`,
    validate: (result) => {
      if (result.data?.me?.name === 'Alice' && result.data?.me?.salary) {
        return { pass: true, message: 'As an admin, you can see your own salary.' };
      }
      return { pass: false, message: 'Query: { me { name email role salary } }' };
    },
  });

  await explainStep({
    title: 'Field-Level Authorization',
    explanation: [
      'Authorization can happen at different levels:',
      '',
      '  1. Query level — Block entire queries based on role',
      '  2. Type level  — Block access to certain types',
      '  3. Field level — Most granular, per-field permission checks',
      '',
      'Field-level is the most common and flexible approach.',
      'You\'re logged in as Alice (ADMIN), so you can see everyone\'s data.',
      'But salary and email have special rules...',
    ],
  });

  await queryPlayground({
    title: 'Exercise: Field-Level Auth in Action',
    explanation: [
      'Query user "u2" (Bob) and request name, email, role, and salary.',
      'Since you\'re an ADMIN, you should see everything.',
      'If you were a regular user, the salary would be hidden!',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  user(id: "u2") {
    name
    email
    role
    salary
  }
}`,
    validate: (result) => {
      if (result.data?.user?.name === 'Bob' && result.data?.user?.salary) {
        return { pass: true, message: 'Admin access granted! You can see Bob\'s salary. Regular users would get an error.' };
      }
      return { pass: false, message: 'Query user u2 with name, email, role, salary.' };
    },
  });

  await explainStep({
    title: 'Authorization Patterns',
    explanation: [
      'Common patterns for authorization in GraphQL:',
      '',
      '1. Resolver-level checks (what we just did)',
      '   → Check permissions in each resolver',
      '',
      '2. Directive-based auth',
      '   → @auth(requires: ADMIN) on schema fields',
      '',
      '3. Middleware/Shield pattern',
      '   → Separate auth logic from business logic',
    ],
    code: `# Directive-based auth (schema-level)
directive @auth(requires: Role!) on FIELD_DEFINITION

type Query {
  me: User @auth(requires: USER)
  users: [User!]! @auth(requires: ADMIN)
  analytics: Analytics @auth(requires: ADMIN)
}

# GraphQL Shield (code-level)
const permissions = shield({
  Query: {
    users: isAdmin,
    me: isAuthenticated,
  },
  User: {
    salary: or(isAdmin, isOwner),
    email: or(isAdmin, isOwner),
  },
});`,
  });

  await quizStep({
    question: 'Where should authentication (token verification) happen in a GraphQL server?',
    choices: [
      'In every resolver individually',
      'In the context setup (before resolvers run)',
      'In the schema definition',
      'On the client side only',
    ],
    answer: 'In the context setup (before resolvers run)',
    successMessage: 'Correct! Token verification happens once in context setup, then resolvers use the context.',
  });

  await quizStep({
    question: 'What\'s the most granular level of authorization in GraphQL?',
    choices: [
      'Endpoint level',
      'Query/Mutation level',
      'Type level',
      'Field level',
    ],
    answer: 'Field level',
    successMessage: 'Right! Field-level auth gives you the finest control — like showing salary only to admins.',
  });
}
