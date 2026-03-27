import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 3,
  title: 'Queries, Fields & Arguments',
  level: 'beginner',
  description: 'Deep dive into queries — arguments, aliases, and nested fields.',
};

const bookSchema = `type Book {
  id: ID!
  title: String!
  author: Author!
  year: Int
  rating: Float
  genre: String
}

type Author {
  id: ID!
  name: String!
  nationality: String
  books: [Book!]!
}

type Query {
  books: [Book!]!
  book(id: ID!): Book
  author(id: ID!): Author
  booksByGenre(genre: String!): [Book!]!
}`;

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

const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find(b => b.id === id),
    author: (_, { id }) => authors.find(a => a.id === id),
    booksByGenre: (_, { genre }) => books.filter(b => b.genre.toLowerCase() === genre.toLowerCase()),
  },
  Book: {
    author: (book) => authors.find(a => a.id === book.authorId),
  },
  Author: {
    books: (author) => books.filter(b => b.authorId === author.id),
  },
};

export async function run() {
  await explainStep({
    title: 'Arguments',
    explanation: [
      'Fields can accept arguments, just like function parameters:',
    ],
    code: `# Schema defines what arguments a field accepts
type Query {
  book(id: ID!): Book
  booksByGenre(genre: String!): [Book!]!
}

# Query uses arguments to filter/select data
{
  book(id: "2") {
    title
    year
  }
}`,
  });

  await queryPlayground({
    title: 'Exercise: Using Arguments',
    explanation: [
      'Query the book with id "2" and get its title, year, and rating.',
    ],
    schema: bookSchema,
    resolvers,
    defaultQuery: `{
  book(id: "2") {
    title
  }
}`,
    validate: (result) => {
      const book = result.data?.book;
      if (book?.title === '1984' && book?.year && book?.rating !== undefined) {
        return { pass: true, message: 'Perfect! You fetched a specific book with arguments.' };
      }
      if (book?.title === '1984') {
        return { pass: false, message: 'Almost! Also request the year and rating fields.' };
      }
      return { pass: false, message: 'Query book(id: "2") and ask for title, year, and rating.' };
    },
    hint: 'Use: { book(id: "2") { title year rating } }',
  });

  await explainStep({
    title: 'Nested Fields (Relationships)',
    explanation: [
      'One of GraphQL\'s superpowers is traversing relationships:',
    ],
    code: `# A Book has an Author, and an Author has Books
# You can nest as deep as you want:
{
  book(id: "2") {
    title
    author {
      name
      nationality
      books {
        title
      }
    }
  }
}`,
  });

  await queryPlayground({
    title: 'Exercise: Nested Queries',
    explanation: [
      'Find the author with id "a2" and get:',
      '  • Their name and nationality',
      '  • All their book titles and years',
    ],
    schema: bookSchema,
    resolvers,
    defaultQuery: `{
  author(id: "a2") {
    name
  }
}`,
    validate: (result) => {
      const author = result.data?.author;
      if (author?.name && author?.nationality && author?.books?.length > 0 && author.books[0].title) {
        return { pass: true, message: 'Excellent! You navigated a nested relationship.' };
      }
      return { pass: false, message: 'Make sure to include nationality and books { title year }.' };
    },
    hint: 'Nest the books field inside author, with title and year inside books.',
  });

  await explainStep({
    title: 'Aliases',
    explanation: [
      'What if you want to query the same field with different arguments?',
      'You\'d get a name collision! Aliases solve this:',
    ],
    code: `# Without aliases — ERROR! Duplicate field "book"
{
  book(id: "1") { title }
  book(id: "2") { title }
}

# With aliases — works perfectly!
{
  gatsby: book(id: "1") { title year }
  orwell: book(id: "2") { title year }
}`,
  });

  await queryPlayground({
    title: 'Exercise: Using Aliases',
    explanation: [
      'Use aliases to fetch TWO books in a single query:',
      '  • Book "1" aliased as "firstBook"',
      '  • Book "4" aliased as "lastBook"',
      'Get the title and rating for each.',
    ],
    schema: bookSchema,
    resolvers,
    defaultQuery: `{
  firstBook: book(id: "1") {
    title
  }
}`,
    validate: (result) => {
      if (result.data?.firstBook?.title && result.data?.lastBook?.title) {
        return { pass: true, message: 'Great use of aliases! Two queries in one request.' };
      }
      return { pass: false, message: 'Use aliases: firstBook: book(id: "1") and lastBook: book(id: "4")' };
    },
    hint: 'Add another aliased field: lastBook: book(id: "4") { title rating }',
  });

  await quizStep({
    question: 'When do you NEED to use aliases in GraphQL?',
    choices: [
      'When querying more than 10 fields',
      'When the same field is queried multiple times with different arguments',
      'When using nested types',
      'Aliases are always required',
    ],
    answer: 'When the same field is queried multiple times with different arguments',
    successMessage: 'Correct! Aliases prevent field name collisions in the response.',
  });
}
