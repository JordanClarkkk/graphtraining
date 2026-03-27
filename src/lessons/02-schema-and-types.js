import { explainStep, quizStep, schemaPlayground, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 2,
  title: 'Schema & Type System',
  level: 'beginner',
  description: 'Learn about GraphQL\'s type system — the foundation of every GraphQL API.',
};

export async function run() {
  await explainStep({
    title: 'The GraphQL Schema',
    explanation: [
      'Every GraphQL API is defined by a schema. The schema describes:',
      '  • What types of data exist',
      '  • What fields each type has',
      '  • How types relate to each other',
      '  • What queries and mutations are available',
      '',
      'The schema is written in SDL (Schema Definition Language).',
      'Think of it as a contract between the client and server.',
    ],
  });

  await explainStep({
    title: 'Scalar Types (Built-in)',
    explanation: [
      'GraphQL has 5 built-in scalar types:',
      '',
      '  String  — UTF-8 text          "hello"',
      '  Int     — 32-bit integer       42',
      '  Float   — Double-precision     3.14',
      '  Boolean — true or false        true',
      '  ID      — Unique identifier    "abc123"',
      '',
      'ID is serialized as a String but semantically represents a unique identifier.',
    ],
  });

  await explainStep({
    title: 'Object Types',
    explanation: [
      'Object types are the building blocks of your schema.',
      'They group related fields together:',
    ],
    code: `type User {
  id: ID!
  name: String!
  email: String!
  age: Int
  isActive: Boolean!
}

type Post {
  id: ID!
  title: String!
  body: String
  author: User!
  likes: Int
}`,
  });

  await explainStep({
    title: 'The ! (Non-null) Modifier',
    explanation: [
      'The exclamation mark (!) means a field cannot be null:',
      '',
      '  name: String!   — name is REQUIRED (never null)',
      '  name: String    — name is OPTIONAL (can be null)',
      '',
      '  friends: [User!]!  — The list is required AND each item is required',
      '  friends: [User]    — The list can be null, items can be null',
      '',
      'Rule of thumb: Use ! for fields that should always have a value.',
    ],
  });

  await quizStep({
    question: 'What does [String!]! mean?',
    choices: [
      'A nullable list of nullable strings',
      'A non-null list of nullable strings',
      'A non-null list of non-null strings',
      'An array that must contain exactly one string',
    ],
    answer: 'A non-null list of non-null strings',
    successMessage: 'Right! The outer ! means the list itself can\'t be null, the inner ! means no item can be null.',
    hint: 'The ! after the bracket means the list is required. The ! inside means each element is required.',
  });

  await schemaPlayground({
    title: 'Exercise: Define a Type',
    explanation: [
      'Define a schema with a "Book" type that has:',
      '  • id (required ID)',
      '  • title (required String)',
      '  • author (required String)',
      '  • year (optional Int)',
      '  • rating (optional Float)',
      '',
      'Also add a Query type with a "books" field that returns a list of Books.',
    ],
    defaultSchema: `type Book {
  # Add fields here
}

type Query {
  books: [Book]
}`,
    validate: (schema) => {
      const hasId = /id\s*:\s*ID!/i.test(schema);
      const hasTitle = /title\s*:\s*String!/i.test(schema);
      const hasAuthor = /author\s*:\s*String!/i.test(schema);
      const hasYear = /year\s*:\s*Int(?!\s*!)/i.test(schema);
      const hasRating = /rating\s*:\s*Float/i.test(schema);
      const hasBooks = /books\s*:\s*\[Book/i.test(schema);

      if (!hasId) return { pass: false, message: 'Missing "id: ID!" field on Book.' };
      if (!hasTitle) return { pass: false, message: 'Missing "title: String!" field on Book.' };
      if (!hasAuthor) return { pass: false, message: 'Missing "author: String!" field on Book.' };
      if (!hasBooks) return { pass: false, message: 'The Query type needs a "books" field returning [Book].' };
      return { pass: true, message: 'Great schema definition!' };
    },
    hint: 'Remember: required fields use !, optional fields don\'t.',
    solution: `type Book {
  id: ID!
  title: String!
  author: String!
  year: Int
  rating: Float
}

type Query {
  books: [Book]
}`,
  });

  await queryPlayground({
    title: 'Query Your Schema',
    explanation: [
      'Now let\'s query some books! The schema and data are ready.',
      'Write a query to get the title and author of all books.',
    ],
    schema: `type Book {
  id: ID!
  title: String!
  author: String!
  year: Int
  rating: Float
}

type Query {
  books: [Book!]!
}`,
    resolvers: {
      Query: {
        books: () => [
          { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925, rating: 4.2 },
          { id: '2', title: '1984', author: 'George Orwell', year: 1949, rating: 4.7 },
          { id: '3', title: 'To Kill a Mockingbird', author: 'Harper Lee', year: 1960, rating: 4.3 },
        ],
      },
    },
    defaultQuery: `{
  books {
    title
    author
  }
}`,
    validate: (result) => {
      if (result.data?.books && result.data.books.length > 0 && result.data.books[0].title) {
        return { pass: true, message: 'You queried the book data! Notice you only got back the fields you asked for.' };
      }
      return { pass: false, message: 'Try querying: { books { title author } }' };
    },
    hint: 'Use: { books { title author } }',
  });
}
