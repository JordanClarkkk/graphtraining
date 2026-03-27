import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 9,
  title: 'Error Handling',
  level: 'intermediate',
  description: 'Understand how GraphQL handles errors and partial responses.',
};

export async function run() {
  await explainStep({
    title: 'GraphQL Error Model',
    explanation: [
      'GraphQL handles errors differently from REST:',
      '',
      '  REST:  HTTP status codes (404, 500, etc.)',
      '  GraphQL: Always returns HTTP 200, errors are in the response body',
      '',
      'A GraphQL response has two top-level fields:',
      '  { "data": {...}, "errors": [...] }',
      '',
      'Key insight: You can get BOTH data AND errors in the same response!',
      'This is called a "partial response" — some fields resolved, others failed.',
    ],
  });

  await explainStep({
    title: 'Error Structure',
    code: `{
  "data": {
    "user": {
      "name": "Alice",
      "secretField": null  // This field errored
    }
  },
  "errors": [
    {
      "message": "Not authorized to access secretField",
      "locations": [{ "line": 4, "column": 5 }],
      "path": ["user", "secretField"],
      "extensions": {
        "code": "UNAUTHORIZED"
      }
    }
  ]
}`,
    language: 'json',
  });

  const schema = `type User {
  id: ID!
  name: String!
  email: String!
  role: String!
  salary: Float
  secretNotes: String
}

type Query {
  user(id: ID!): User
  users: [User!]!
  riskyField: String
}`;

  const users = [
    { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin', salary: 95000, secretNotes: 'Classified info' },
    { id: '2', name: 'Bob', email: 'bob@example.com', role: 'Developer', salary: 85000, secretNotes: 'Secret project' },
  ];

  const resolvers = {
    Query: {
      user: (_, { id }) => {
        const user = users.find(u => u.id === id);
        if (!user) throw new Error(`User with id "${id}" not found`);
        return user;
      },
      users: () => users,
      riskyField: () => { throw new Error('This field always fails!'); },
    },
    User: {
      salary: (user) => {
        throw new Error('Access denied: salary is confidential');
      },
      secretNotes: (user) => {
        throw new Error('Access denied: classified information');
      },
    },
  };

  await queryPlayground({
    title: 'Exercise: Observe Partial Responses',
    explanation: [
      'Query user "1" and request name, email, role, AND salary.',
      'The salary field will throw an error.',
      'Watch how GraphQL returns data for the fields that worked',
      'and an error for the field that failed.',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  user(id: "1") {
    name
    email
    role
    salary
  }
}`,
    validate: (result) => {
      if (result.errors && result.data?.user?.name) {
        return { pass: true, message: 'Partial response! You got name/email/role data AND a salary error.' };
      }
      if (result.data?.user) {
        return { pass: false, message: 'Try including the salary field to see the error.' };
      }
      return { pass: false, message: 'Query user "1" with name, email, role, and salary.' };
    },
  });

  await queryPlayground({
    title: 'Exercise: Non-existent Data',
    explanation: [
      'What happens when you query a user that doesn\'t exist?',
      'Try querying user with id "999".',
    ],
    schema,
    resolvers,
    defaultQuery: `{
  user(id: "999") {
    name
    email
  }
}`,
    validate: (result) => {
      if (result.errors && result.errors.some(e => e.message.includes('not found'))) {
        return { pass: true, message: 'The resolver threw an error for the missing user. This is a common error handling pattern.' };
      }
      return { pass: false, message: 'Query a non-existent user id like "999".' };
    },
  });

  await explainStep({
    title: 'Error Handling Strategies',
    explanation: [
      'There are several approaches to error handling in GraphQL:',
      '',
      '1. Throw errors (what we just saw)',
      '   → Errors appear in the "errors" array',
      '   → Nullable fields become null, non-null fields propagate up',
      '',
      '2. Union-based errors (recommended for expected errors)',
    ],
    code: `union UserResult = User | NotFoundError | ValidationError

type NotFoundError {
  message: String!
  id: ID!
}

type ValidationError {
  message: String!
  field: String!
}

type Query {
  user(id: ID!): UserResult!
}

# Query:
{
  user(id: "1") {
    ... on User { name email }
    ... on NotFoundError { message id }
    ... on ValidationError { message field }
  }
}`,
  });

  await explainStep({
    title: 'Non-null Error Propagation',
    explanation: [
      'Important: When a non-null field (!) errors, the error propagates UP',
      'to the nearest nullable parent:',
      '',
      '  type User {',
      '    name: String!     # If this errors...',
      '    email: String     # This is fine',
      '  }',
      '',
      '  type Query {',
      '    user(id: ID!): User   # ...the whole user becomes null!',
      '  }',
      '',
      'Why? Because name is String! (non-null), it can\'t be null.',
      'So GraphQL nulls out the parent "user" instead.',
      '',
      'This is called "null bubbling" — be careful with non-null types!',
    ],
  });

  await quizStep({
    question: 'What HTTP status code does a GraphQL API return when there are errors?',
    choices: [
      '400 Bad Request',
      '500 Internal Server Error',
      '200 OK (with errors in the response body)',
      'It depends on the error type',
    ],
    answer: '200 OK (with errors in the response body)',
    successMessage: 'Correct! GraphQL always returns 200. Errors are part of the response, not the status code.',
  });

  await quizStep({
    question: 'What happens when a non-null (!) field resolver throws an error?',
    choices: [
      'The field returns null',
      'The error is silently ignored',
      'The error propagates up to the nearest nullable parent',
      'The entire response is null',
    ],
    answer: 'The error propagates up to the nearest nullable parent',
    successMessage: 'Right! This is "null bubbling" — non-null fields can\'t be null, so the parent becomes null instead.',
  });
}
