import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 1,
  title: 'What is GraphQL?',
  level: 'beginner',
  description: 'Understand what GraphQL is, how it differs from REST, and why it matters.',
};

export async function run() {
  await explainStep({
    title: 'Welcome to GraphQL!',
    explanation: [
      'GraphQL is a query language for APIs, developed by Facebook in 2012',
      'and open-sourced in 2015.',
      '',
      'Unlike REST APIs where you hit different endpoints for different data,',
      'GraphQL gives you a single endpoint and lets YOU decide exactly what',
      'data you want back.',
      '',
      'Think of it like ordering at a restaurant:',
      '  REST  = Fixed menu combos (you get everything whether you want it or not)',
      '  GraphQL = Build your own plate (pick exactly what you want)',
    ],
  });

  await explainStep({
    title: 'REST vs GraphQL — A Comparison',
    explanation: [
      'REST API approach (multiple requests):',
      '  GET /users/1           → { id, name, email, avatar, ... }',
      '  GET /users/1/posts     → [{ id, title, body, ... }, ...]',
      '  GET /users/1/followers → [{ id, name, ... }, ...]',
      '',
      'GraphQL approach (single request):',
    ],
    code: `query {
  user(id: 1) {
    name
    posts {
      title
    }
    followers {
      name
    }
  }
}`,
    language: 'graphql',
  });

  await explainStep({
    title: 'Key Benefits of GraphQL',
    explanation: [
      '1. No over-fetching  — You only get the fields you ask for',
      '2. No under-fetching — Get all related data in a single request',
      '3. Strongly typed     — The schema defines exactly what\'s available',
      '4. Self-documenting   — The schema IS the documentation',
      '5. Evolvable          — Add fields without versioning your API',
      '',
      'GraphQL has three main operation types:',
      '  • Query        — Read data (like GET)',
      '  • Mutation     — Write/modify data (like POST/PUT/DELETE)',
      '  • Subscription — Real-time updates (like WebSockets)',
    ],
  });

  await quizStep({
    title: 'Quick Check',
    question: 'What is the main advantage of GraphQL over REST?',
    choices: [
      'It\'s faster at the network level',
      'You can request exactly the data you need in one request',
      'It only works with JSON',
      'It replaces your database',
    ],
    answer: 'You can request exactly the data you need in one request',
    successMessage: 'Exactly! GraphQL lets you fetch precisely what you need — no more, no less.',
    hint: 'Think about the restaurant analogy — fixed combo vs build your own plate.',
  });

  await queryPlayground({
    title: 'Your First GraphQL Query',
    explanation: [
      'Let\'s run your very first GraphQL query!',
      'The schema below defines a simple "hello" field.',
      'Write a query that asks for the "hello" field.',
    ],
    schema: `type Query {
  hello: String
}`,
    resolvers: {
      Query: {
        hello: () => 'Hello, World! Welcome to GraphQL!',
      },
    },
    defaultQuery: `{
  hello
}`,
    validate: (result) => {
      if (result.data?.hello) {
        return { pass: true, message: 'You just ran your first GraphQL query!' };
      }
      return { pass: false, message: 'Try querying the "hello" field.' };
    },
    hint: 'The simplest query is just: { hello }',
    solution: '{\n  hello\n}',
  });
}
