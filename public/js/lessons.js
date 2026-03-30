// ===== GraphQL Trainer — Lesson Data (Beginner: Lessons 1-4) =====

window.LESSONS = [

// ============================================================
// LESSON 1: What is GraphQL?
// ============================================================
{
  id: 1,
  title: 'What is GraphQL?',
  level: 'beginner',
  steps: [
    {
      type: 'explain',
      title: 'Welcome to GraphQL!',
      content: `
        <p>
          <strong>GraphQL</strong> is a query language for APIs, developed by Facebook in 2012
          and open-sourced in 2015. It gives clients the power to ask for <em>exactly</em>
          the data they need — nothing more, nothing less.
        </p>
        <p>
          Think of it like ordering food:
        </p>
        <ul>
          <li><strong>REST</strong> = Fixed menu combos — you get everything whether you want it or not</li>
          <li><strong>GraphQL</strong> = Build your own plate — pick exactly what you want</li>
        </ul>
        <p>
          Instead of hitting multiple endpoints (<code>/users</code>, <code>/posts</code>, <code>/comments</code>),
          GraphQL uses a <strong>single endpoint</strong> and lets your query describe the shape of the data you want.
        </p>
      `,
    },
    {
      type: 'explain',
      title: 'REST vs GraphQL — A Comparison',
      content: `
        <p>With <strong>REST</strong>, you'd make multiple requests to get related data:</p>
        <table class="comparison-table">
          <tr><th>REST Approach</th><th>GraphQL Approach</th></tr>
          <tr>
            <td>
              <code>GET /users/1</code><br>
              <code>GET /users/1/posts</code><br>
              <code>GET /users/1/followers</code><br>
              <em>3 separate requests</em>
            </td>
            <td>
              <em>1 single request — see the query below ↓</em>
            </td>
          </tr>
        </table>
        <p>In GraphQL, one query gets everything:</p>
      `,
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
    },
    {
      type: 'explain',
      title: 'Key Benefits of GraphQL',
      content: `
        <p>Why are so many companies (GitHub, Shopify, Twitter, Stripe) adopting GraphQL?</p>
        <ol>
          <li><strong>No over-fetching</strong> — You only get the fields you ask for</li>
          <li><strong>No under-fetching</strong> — Get all related data in a single request</li>
          <li><strong>Strongly typed</strong> — The schema defines exactly what's available</li>
          <li><strong>Self-documenting</strong> — The schema <em>is</em> the documentation</li>
          <li><strong>Evolvable</strong> — Add fields without versioning your API</li>
        </ol>
        <p>GraphQL has <strong>three main operation types</strong>:</p>
        <ul>
          <li><strong>Query</strong> — Read data (like GET)</li>
          <li><strong>Mutation</strong> — Write/modify data (like POST/PUT/DELETE)</li>
          <li><strong>Subscription</strong> — Real-time updates (like WebSockets)</li>
        </ul>
      `,
    },
    {
      type: 'quiz',
      title: 'Quick Check',
      question: 'What is the main advantage of GraphQL over REST?',
      choices: [
        "It's faster at the network level",
        'You can request exactly the data you need in one request',
        'It only works with JSON',
        'It replaces your database',
      ],
      answer: 'You can request exactly the data you need in one request',
      successMessage: 'Exactly! GraphQL lets you fetch precisely what you need — no more, no less.',
      hint: 'Think about the restaurant analogy — fixed combo vs build your own plate.',
    },
    {
      type: 'playground',
      title: 'Your First GraphQL Query!',
      content: `
        <p>Let's run your very first GraphQL query! The schema below defines a simple <code>hello</code> field.
        Press <strong>▶ Run</strong> (or <kbd>Cmd+Enter</kbd>) to execute it.</p>
        <p>Try editing it — what happens if you change the field name?</p>
      `,
      schema: `type Query {
  hello: String
}`,
      resolverKey: '1:hello',
      defaultQuery: `{
  hello
}`,
      validate: (result) => {
        if (result.data?.hello) {
          return { pass: true, message: "You just ran your first GraphQL query! Welcome to GraphQL!" };
        }
        return { pass: false, message: 'Try querying the "hello" field: { hello }' };
      },
      hint: 'The simplest query is just: { hello }',
      solution: `{\n  hello\n}`,
    },
  ],
},

// ============================================================
// LESSON 2: Schema & Type System
// ============================================================
{
  id: 2,
  title: 'Schema & Type System',
  level: 'beginner',
  steps: [
    {
      type: 'explain',
      title: 'The GraphQL Schema',
      content: `
        <p>Every GraphQL API is defined by a <strong>schema</strong>. The schema is the contract
        between the client and server — it describes:</p>
        <ul>
          <li>What <strong>types</strong> of data exist</li>
          <li>What <strong>fields</strong> each type has</li>
          <li>How types <strong>relate</strong> to each other</li>
          <li>What <strong>queries and mutations</strong> are available</li>
        </ul>
        <p>The schema is written in <strong>SDL</strong> (Schema Definition Language) — a clean,
        readable syntax that you'll learn right now.</p>
      `,
    },
    {
      type: 'explain',
      title: 'Scalar Types (Built-in)',
      content: `
        <p>GraphQL has <strong>5 built-in scalar types</strong> — the primitive building blocks:</p>
        <table class="comparison-table">
          <tr><th>Type</th><th>Description</th><th>Example</th></tr>
          <tr><td><code>String</code></td><td>UTF-8 text</td><td><code>"hello"</code></td></tr>
          <tr><td><code>Int</code></td><td>32-bit integer</td><td><code>42</code></td></tr>
          <tr><td><code>Float</code></td><td>Double-precision decimal</td><td><code>3.14</code></td></tr>
          <tr><td><code>Boolean</code></td><td>true or false</td><td><code>true</code></td></tr>
          <tr><td><code>ID</code></td><td>Unique identifier (serialized as String)</td><td><code>"abc123"</code></td></tr>
        </table>
      `,
    },
    {
      type: 'explain',
      title: 'Object Types',
      content: `
        <p><strong>Object types</strong> are the building blocks of your schema.
        They group related fields together, just like objects/structs in code:</p>
      `,
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
    },
    {
      type: 'explain',
      title: 'The ! (Non-null) Modifier',
      content: `
        <p>The exclamation mark <code>!</code> means a field <strong>cannot be null</strong>:</p>
        <table class="comparison-table">
          <tr><th>Declaration</th><th>Meaning</th></tr>
          <tr><td><code>name: String!</code></td><td>name is <strong>required</strong> (never null)</td></tr>
          <tr><td><code>name: String</code></td><td>name is <strong>optional</strong> (can be null)</td></tr>
          <tr><td><code>friends: [User!]!</code></td><td>The list is required AND each item is required</td></tr>
          <tr><td><code>friends: [User]</code></td><td>The list can be null, items can be null</td></tr>
        </table>
        <div class="info-box tip">
          <strong>Rule of thumb:</strong> Use <code>!</code> for fields that should always have a value.
          In practice, most fields should be non-null.
        </div>
      `,
    },
    {
      type: 'quiz',
      title: 'Type System Quiz',
      question: 'What does [String!]! mean?',
      choices: [
        'A nullable list of nullable strings',
        'A non-null list of nullable strings',
        'A non-null list of non-null strings',
        'An array that must contain exactly one string',
      ],
      answer: 'A non-null list of non-null strings',
      successMessage: "Right! The outer ! means the list itself can't be null, the inner ! means no item can be null.",
      hint: 'The ! after the bracket means the list is required. The ! inside means each element is required.',
    },
    {
      type: 'schema-playground',
      title: 'Exercise: Define a Book Type',
      content: `
        <p>Define a schema with a <strong>Book</strong> type that has:</p>
        <ul>
          <li><code>id</code> — required ID</li>
          <li><code>title</code> — required String</li>
          <li><code>author</code> — required String</li>
          <li><code>year</code> — optional Int</li>
          <li><code>rating</code> — optional Float</li>
        </ul>
        <p>Also include a <code>Query</code> type with a <code>books</code> field that returns a list of Books.</p>
        <p>Press <strong>✓ Validate</strong> when you're done!</p>
      `,
      defaultSchema: `type Book {
  # Add your fields here!

}

type Query {
  books: [Book]
}`,
      validate: (schema) => {
        const hasId = /id\s*:\s*ID!/i.test(schema);
        const hasTitle = /title\s*:\s*String!/i.test(schema);
        const hasAuthor = /author\s*:\s*String!/i.test(schema);
        const hasYear = /year\s*:\s*Int/i.test(schema);
        const hasBooks = /books\s*:\s*\[Book/i.test(schema);
        if (!hasId) return { pass: false, message: 'Missing "id: ID!" field on Book.' };
        if (!hasTitle) return { pass: false, message: 'Missing "title: String!" field on Book.' };
        if (!hasAuthor) return { pass: false, message: 'Missing "author: String!" field on Book.' };
        if (!hasBooks) return { pass: false, message: 'The Query type needs a "books" field returning [Book].' };
        return { pass: true, message: 'Great schema definition! Your Book type is well designed.' };
      },
      hint: 'Required fields use !, optional fields don\'t. Example: title: String!',
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
    },
    {
      type: 'playground',
      title: 'Exercise: Query Your Book Data',
      content: `
        <p>Now let's query some books! The schema and data are ready — 3 classic novels are in the database.</p>
        <p>Write a query to get the <code>title</code>, <code>author</code>, and <code>year</code> of all books.</p>
        <p>Try also requesting just <code>title</code> — notice you only get back what you ask for!</p>
      `,
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
      resolverKey: '2:books',
      defaultQuery: `{
  books {
    title
    author
  }
}`,
      validate: (result) => {
        if (result.data?.books?.length > 0 && result.data.books[0].title) {
          return { pass: true, message: 'You queried the book data! Notice you only got back the fields you asked for.' };
        }
        return { pass: false, message: 'Try: { books { title author } }' };
      },
      hint: 'Query: { books { title author year } }',
    },
  ],
},

// ============================================================
// LESSON 3: Queries, Fields & Arguments
// ============================================================
{
  id: 3,
  title: 'Queries, Fields & Arguments',
  level: 'beginner',
  steps: [
    {
      type: 'explain',
      title: 'Arguments — Filtering Data',
      content: `
        <p>Fields can accept <strong>arguments</strong>, just like function parameters.
        Arguments let you filter, sort, or select specific data:</p>
      `,
      code: `# The schema defines what arguments a field accepts:
type Query {
  book(id: ID!): Book
  booksByGenre(genre: String!): [Book!]!
}

# Your query passes argument values:
{
  book(id: "2") {
    title
    year
  }
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: Using Arguments',
      content: `
        <p>This library has 4 books. Query the book with <code>id: "2"</code> and get its
        <code>title</code>, <code>year</code>, and <code>rating</code>.</p>
        <p>Expand the schema below to see all available fields and queries.</p>
      `,
      schema: `type Book {
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
}`,
      resolverKey: '3:books',
      defaultQuery: `{
  book(id: "2") {
    title
  }
}`,
      validate: (result) => {
        const book = result.data?.book;
        if (book?.title === '1984' && book?.year && book?.rating !== undefined) {
          return { pass: true, message: 'Perfect! You fetched a specific book using an argument.' };
        }
        if (book?.title === '1984') {
          return { pass: false, message: 'Almost! Also request the year and rating fields.' };
        }
        return { pass: false, message: 'Query book(id: "2") and ask for title, year, and rating.' };
      },
      hint: 'Use: { book(id: "2") { title year rating } }',
      solution: `{
  book(id: "2") {
    title
    year
    rating
  }
}`,
    },
    {
      type: 'explain',
      title: 'Nested Fields (Relationships)',
      content: `
        <p>One of GraphQL's <strong>superpowers</strong> is traversing relationships in a single query.
        If a Book has an Author, and an Author has Books, you can nest as deep as you want:</p>
      `,
      code: `{
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
}

# This single query:
# 1. Gets book "2"
# 2. Gets that book's author
# 3. Gets ALL books by that author
# All in one request!`,
    },
    {
      type: 'playground',
      title: 'Exercise: Nested Queries',
      content: `
        <p>Find the author with <code>id: "a2"</code> (George Orwell) and get:</p>
        <ul>
          <li>Their <code>name</code> and <code>nationality</code></li>
          <li>All their book <code>title</code>s and <code>year</code>s</li>
        </ul>
        <p>This is a nested query — you'll query fields <em>within</em> fields!</p>
      `,
      schema: `type Book {
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
}`,
      resolverKey: '3:books',
      defaultQuery: `{
  author(id: "a2") {
    name
  }
}`,
      validate: (result) => {
        const author = result.data?.author;
        if (author?.name && author?.nationality && author?.books?.length > 0 && author.books[0].title) {
          return { pass: true, message: 'Excellent! You navigated a nested relationship — author → books — in one query.' };
        }
        return { pass: false, message: 'Include nationality and books { title year } inside the author query.' };
      },
      hint: 'Nest books inside the author: author(id: "a2") { name nationality books { title year } }',
      solution: `{
  author(id: "a2") {
    name
    nationality
    books {
      title
      year
    }
  }
}`,
    },
    {
      type: 'explain',
      title: 'Aliases',
      content: `
        <p>What if you want to query the <strong>same field twice</strong> with different arguments?
        You'd get a name collision! <strong>Aliases</strong> solve this:</p>
      `,
      code: `# WITHOUT aliases — ERROR! Duplicate field "book"
{
  book(id: "1") { title }
  book(id: "2") { title }
}

# WITH aliases — works perfectly!
{
  gatsby: book(id: "1") {
    title
    year
  }
  orwell: book(id: "2") {
    title
    year
  }
}

# The response uses your alias names:
# { "gatsby": { "title": "..." }, "orwell": { "title": "..." } }`,
    },
    {
      type: 'playground',
      title: 'Exercise: Using Aliases',
      content: `
        <p>Use aliases to fetch <strong>two books</strong> in a single query:</p>
        <ul>
          <li>Book <code>"1"</code> aliased as <code>firstBook</code></li>
          <li>Book <code>"4"</code> aliased as <code>lastBook</code></li>
        </ul>
        <p>Get the <code>title</code> and <code>rating</code> for each.</p>
      `,
      schema: `type Book {
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
}`,
      resolverKey: '3:books',
      defaultQuery: `{
  firstBook: book(id: "1") {
    title
  }
}`,
      validate: (result) => {
        if (result.data?.firstBook?.title && result.data?.lastBook?.title) {
          return { pass: true, message: 'Great use of aliases! Two queries in one request, zero name collisions.' };
        }
        return { pass: false, message: 'Add a second aliased field: lastBook: book(id: "4") { title rating }' };
      },
      hint: 'Add another aliased field: lastBook: book(id: "4") { title rating }',
      solution: `{
  firstBook: book(id: "1") {
    title
    rating
  }
  lastBook: book(id: "4") {
    title
    rating
  }
}`,
    },
    {
      type: 'playground',
      title: 'Bonus: Explore Freely!',
      content: `
        <p>This is a <strong>free playground</strong> — experiment with everything you've learned!</p>
        <p>Ideas to try:</p>
        <ul>
          <li>Query <code>booksByGenre(genre: "Dystopian")</code></li>
          <li>Get all books with their full author details (nested query)</li>
          <li>Use aliases to compare two different genres</li>
          <li>Try querying a field that doesn't exist — what error do you get?</li>
        </ul>
      `,
      schema: `type Book {
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
}`,
      resolverKey: '3:books',
      defaultQuery: `{
  booksByGenre(genre: "Dystopian") {
    title
    author {
      name
      nationality
    }
  }
}`,
    },
    {
      type: 'quiz',
      title: 'Knowledge Check',
      question: 'When do you NEED to use aliases in GraphQL?',
      choices: [
        'When querying more than 10 fields',
        'When the same field is queried multiple times with different arguments',
        'When using nested types',
        'Aliases are always required',
      ],
      answer: 'When the same field is queried multiple times with different arguments',
      successMessage: 'Correct! Aliases prevent field name collisions in the response.',
    },
  ],
},

// ============================================================
// LESSON 4: Fragments & Variables
// ============================================================
{
  id: 4,
  title: 'Fragments & Variables',
  level: 'beginner',
  steps: [
    {
      type: 'explain',
      title: 'Fragments — Reusable Field Sets',
      content: `
        <p>As your queries grow, you'll find yourself repeating the same set of fields.
        <strong>Fragments</strong> let you define a set of fields once and reuse them everywhere:</p>
      `,
      code: `# WITHOUT fragments — lots of repetition:
{
  task1: task(id: "t1") {
    title
    status
    priority
    assignee { name email role }
  }
  task2: task(id: "t2") {
    title
    status
    priority
    assignee { name email role }
  }
}

# WITH fragments — DRY and clean:
fragment TaskDetails on Task {
  title
  status
  priority
  assignee { name email role }
}

{
  task1: task(id: "t1") { ...TaskDetails }
  task2: task(id: "t2") { ...TaskDetails }
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: Using Fragments',
      content: `
        <p>Create a fragment called <code>UserInfo</code> on the <code>User</code> type with fields:
        <code>name</code>, <code>email</code>, <code>role</code>.</p>
        <p>Then use it to query two users:</p>
        <ul>
          <li>User <code>"u1"</code> aliased as <code>admin</code></li>
          <li>User <code>"u2"</code> aliased as <code>dev</code></li>
        </ul>
      `,
      schema: `type User {
  id: ID!
  name: String!
  email: String!
  role: String!
  department: String
}

type Task {
  id: ID!
  title: String!
  status: String!
  assignee: User!
  priority: String!
}

type Query {
  users: [User!]!
  user(id: ID!): User
  tasks(status: String): [Task!]!
  task(id: ID!): Task
}`,
      resolverKey: '4:tasks',
      defaultQuery: `fragment UserInfo on User {
  name
  email
  role
}

{
  admin: user(id: "u1") {
    ...UserInfo
  }
}`,
      validate: (result) => {
        if (result.data?.admin?.name && result.data?.dev?.name) {
          return { pass: true, message: 'Fragments in action! Define once, reuse everywhere.' };
        }
        return { pass: false, message: 'Add a second alias: dev: user(id: "u2") { ...UserInfo }' };
      },
      hint: 'Add: dev: user(id: "u2") { ...UserInfo } alongside the admin query.',
      solution: `fragment UserInfo on User {
  name
  email
  role
}

{
  admin: user(id: "u1") {
    ...UserInfo
  }
  dev: user(id: "u2") {
    ...UserInfo
  }
}`,
    },
    {
      type: 'explain',
      title: 'Variables — Parameterized Queries',
      content: `
        <p>In real apps, you don't hardcode values in queries. <strong>Variables</strong> let you
        pass dynamic values separately — like function parameters:</p>
      `,
      code: `# Query with a variable declaration:
query GetTask($taskId: ID!) {
  task(id: $taskId) {
    title
    status
  }
}

# Variables are sent as JSON alongside the query:
# { "taskId": "t1" }

# The $taskId is substituted at runtime.
# This is how libraries like Apollo Client send queries.`,
    },
    {
      type: 'explain',
      title: 'Variable Syntax Rules',
      content: `
        <p>Variables follow three simple rules:</p>
        <ol>
          <li><strong>Declared</strong> in the operation definition: <code>query MyQuery($var: Type!)</code></li>
          <li><strong>Used</strong> with the <code>$</code> prefix: <code>field(arg: $var)</code></li>
          <li>Can have <strong>default values</strong>: <code>query MyQuery($limit: Int = 10)</code></li>
        </ol>
        <div class="info-box tip">
          <strong>Why use variables?</strong>
          <ul>
            <li>Prevents string interpolation (no injection attacks!)</li>
            <li>Enables query caching on the server</li>
            <li>Cleaner, more maintainable client code</li>
          </ul>
        </div>
      `,
      code: `# Named query with multiple variables and a default:
query GetTasks($status: String, $limit: Int = 10) {
  tasks(status: $status) {
    title
    priority
    assignee {
      name
    }
  }
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: Query with Variables',
      content: `
        <p>Write a named query called <code>GetTasksByStatus</code> that:</p>
        <ul>
          <li>Accepts a <code>$status</code> variable (optional String)</li>
          <li>Returns tasks filtered by status</li>
          <li>Includes <code>title</code>, <code>status</code>, <code>priority</code>, and assignee <code>name</code></li>
        </ul>
        <div class="info-box">
          The variable <code>{"status": "in_progress"}</code> will be sent automatically with your query.
        </div>
      `,
      schema: `type User {
  id: ID!
  name: String!
  email: String!
  role: String!
  department: String
}

type Task {
  id: ID!
  title: String!
  status: String!
  assignee: User!
  priority: String!
}

type Query {
  users: [User!]!
  user(id: ID!): User
  tasks(status: String): [Task!]!
  task(id: ID!): Task
}`,
      resolverKey: '4:tasks',
      variables: { status: 'in_progress' },
      defaultQuery: `query GetTasksByStatus($status: String) {
  tasks(status: $status) {
    title
    status
  }
}`,
      validate: (result) => {
        const tasks = result.data?.tasks;
        if (tasks && tasks.every(t => t.status === 'in_progress') && tasks[0]?.priority) {
          return { pass: true, message: 'You used variables to parameterize your query! This is how real apps work.' };
        }
        if (tasks && tasks.every(t => t.status === 'in_progress')) {
          return { pass: false, message: 'Almost! Also include the priority and assignee { name } fields.' };
        }
        return { pass: false, message: 'Make sure your query uses $status and includes all required fields.' };
      },
      hint: 'Add priority and assignee { name } to your field selection.',
      solution: `query GetTasksByStatus($status: String) {
  tasks(status: $status) {
    title
    status
    priority
    assignee {
      name
    }
  }
}`,
    },
    {
      type: 'playground',
      title: 'Bonus: Combine Fragments + Variables',
      content: `
        <p>Put it all together! Use <strong>both</strong> a fragment and variables to write a clean query:</p>
        <ul>
          <li>Define a <code>TaskInfo</code> fragment on Task</li>
          <li>Use the <code>$status</code> variable to filter</li>
          <li>Include assignee details via the fragment</li>
        </ul>
      `,
      schema: `type User {
  id: ID!
  name: String!
  email: String!
  role: String!
  department: String
}

type Task {
  id: ID!
  title: String!
  status: String!
  assignee: User!
  priority: String!
}

type Query {
  users: [User!]!
  user(id: ID!): User
  tasks(status: String): [Task!]!
  task(id: ID!): Task
}`,
      resolverKey: '4:tasks',
      variables: { status: 'in_progress' },
      defaultQuery: `fragment TaskInfo on Task {
  title
  status
  priority
  assignee {
    name
    role
  }
}

query GetTasks($status: String) {
  tasks(status: $status) {
    ...TaskInfo
  }
}`,
      validate: (result) => {
        const tasks = result.data?.tasks;
        if (tasks && tasks.length > 0 && tasks[0].assignee?.name) {
          return { pass: true, message: 'Beautiful! Fragments + variables = clean, reusable, production-ready queries.' };
        }
        return { pass: false, message: 'Use the fragment spread ...TaskInfo inside tasks { }' };
      },
    },
    {
      type: 'quiz',
      title: 'Final Check',
      question: 'Why should you use variables instead of string interpolation in GraphQL?',
      choices: [
        'Variables are faster to type',
        'They prevent injection attacks and enable query caching',
        "GraphQL doesn't support string values",
        'Variables are only needed for mutations',
      ],
      answer: 'They prevent injection attacks and enable query caching',
      successMessage: 'Exactly! Variables are safer and more performant — always use them in production code.',
    },
  ],
},

// ============================================================
// LESSON 5: Mutations
// ============================================================
{
  id: 5,
  title: 'Mutations',
  level: 'intermediate',
  steps: [
    {
      type: 'explain',
      title: 'Mutations — Modifying Data',
      content: `
        <p>While queries <strong>read</strong> data, mutations <strong>write</strong> data.
        Mutations can create, update, or delete records.</p>
        <p>Convention: mutations live in a <code>Mutation</code> type, separate from <code>Query</code>:</p>
      `,
      code: `type Mutation {
  addTodo(text: String!): Todo!
  toggleTodo(id: ID!): Todo
  deleteTodo(id: ID!): Todo
}

# Using a mutation:
mutation {
  addTodo(text: "Learn mutations") {
    id
    text
    completed
  }
}`,
    },
    {
      type: 'explain',
      title: 'Mutation Response Pattern',
      content: `
        <p>A key GraphQL pattern: mutations <strong>return the modified data</strong>.
        This means your UI can update immediately without a second request.</p>
        <ul>
          <li>Create a todo → mutation returns the <strong>new</strong> todo</li>
          <li>Update a todo → mutation returns the <strong>updated</strong> todo</li>
          <li>Delete a todo → mutation returns the <strong>deleted</strong> todo</li>
        </ul>
        <p>You choose what fields to get back — just like a query!</p>
      `,
      code: `# The schema for this lesson's exercises:
type Todo {
  id: ID!
  text: String!
  completed: Boolean!
  createdAt: String!
}

type Query {
  todos: [Todo!]!
  todo(id: ID!): Todo
}

type Mutation {
  addTodo(text: String!): Todo!
  toggleTodo(id: ID!): Todo
  deleteTodo(id: ID!): Todo
  updateTodo(id: ID!, text: String, completed: Boolean): Todo
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: See the Current Todos',
      content: `
        <p>Before we mutate anything, let's see what's already in the database.
        Query all todos with their <code>id</code>, <code>text</code>, and <code>completed</code> status.</p>
      `,
      schema: `type Todo {
  id: ID!
  text: String!
  completed: Boolean!
  createdAt: String!
}

type Query {
  todos: [Todo!]!
  todo(id: ID!): Todo
}

type Mutation {
  addTodo(text: String!): Todo!
  toggleTodo(id: ID!): Todo
  deleteTodo(id: ID!): Todo
  updateTodo(id: ID!, text: String, completed: Boolean): Todo
}`,
      resolverKey: '5:todos',
      defaultQuery: `{
  todos {
    id
    text
    completed
  }
}`,
      validate: (result) => {
        if (result.data?.todos?.length >= 3) {
          return { pass: true, message: 'There are 3 todos. Notice #1 is completed, #2 and #3 are not. Now let\'s mutate them!' };
        }
        return { pass: false, message: 'Query: { todos { id text completed } }' };
      },
    },
    {
      type: 'playground',
      title: 'Exercise: Create a Todo',
      content: `
        <p>Write a mutation to add a new todo with the text <code>"Practice GraphQL"</code>.</p>
        <p>Request back the <code>id</code>, <code>text</code>, and <code>completed</code> fields.</p>
        <div class="info-box tip">
          <strong>Important:</strong> Mutations use the keyword <code>mutation</code> instead of <code>query</code>
          (or the shorthand <code>{ }</code>).
        </div>
      `,
      schema: `type Todo {
  id: ID!
  text: String!
  completed: Boolean!
  createdAt: String!
}

type Query {
  todos: [Todo!]!
  todo(id: ID!): Todo
}

type Mutation {
  addTodo(text: String!): Todo!
  toggleTodo(id: ID!): Todo
  deleteTodo(id: ID!): Todo
  updateTodo(id: ID!, text: String, completed: Boolean): Todo
}`,
      resolverKey: '5:todos',
      defaultQuery: `mutation {
  addTodo(text: "Practice GraphQL") {
    id
    text
    completed
  }
}`,
      validate: (result) => {
        if (result.data?.addTodo?.text) {
          return { pass: true, message: 'Todo created! Notice it returned the new todo with an auto-generated id.' };
        }
        return { pass: false, message: 'Use: mutation { addTodo(text: "Practice GraphQL") { id text completed } }' };
      },
      hint: 'Start with the keyword "mutation" then call addTodo with a text argument.',
      solution: `mutation {
  addTodo(text: "Practice GraphQL") {
    id
    text
    completed
  }
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: Toggle a Todo',
      content: `
        <p>Todo #2 (<em>"Master mutations"</em>) is currently incomplete.</p>
        <p>Write a mutation to toggle it to completed. Get back <code>id</code>, <code>text</code>, and <code>completed</code>.</p>
      `,
      schema: `type Todo {
  id: ID!
  text: String!
  completed: Boolean!
  createdAt: String!
}

type Query {
  todos: [Todo!]!
  todo(id: ID!): Todo
}

type Mutation {
  addTodo(text: String!): Todo!
  toggleTodo(id: ID!): Todo
  deleteTodo(id: ID!): Todo
  updateTodo(id: ID!, text: String, completed: Boolean): Todo
}`,
      resolverKey: '5:todos',
      defaultQuery: `mutation {
  toggleTodo(id: "2") {
    id
    text
    completed
  }
}`,
      validate: (result) => {
        if (result.data?.toggleTodo?.completed === true) {
          return { pass: true, message: 'Toggled! The completed field flipped from false to true.' };
        }
        return { pass: false, message: 'Use: mutation { toggleTodo(id: "2") { id text completed } }' };
      },
      hint: 'mutation { toggleTodo(id: "2") { id text completed } }',
    },
    {
      type: 'explain',
      title: 'Input Types',
      content: `
        <p>For mutations with many parameters, use <strong>Input types</strong> to group them cleanly:</p>
      `,
      code: `# Instead of many loose arguments:
type Mutation {
  createUser(name: String!, email: String!, age: Int, role: String!): User
}

# Use an input type:
input CreateUserInput {
  name: String!
  email: String!
  age: Int
  role: String!
}

type Mutation {
  createUser(input: CreateUserInput!): User
}

# Usage:
mutation {
  createUser(input: {
    name: "Alice"
    email: "alice@example.com"
    role: "Admin"
  }) {
    id
    name
  }
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: Multiple Mutations in One Request',
      content: `
        <p>You can run <strong>multiple mutations</strong> in a single request.
        GraphQL executes them <strong>in order</strong> (sequentially, not in parallel).</p>
        <p>In one request:</p>
        <ul>
          <li>Add a new todo (alias: <code>newItem</code>)</li>
          <li>Toggle todo #1 (alias: <code>toggled</code>)</li>
        </ul>
      `,
      schema: `type Todo {
  id: ID!
  text: String!
  completed: Boolean!
  createdAt: String!
}

type Query {
  todos: [Todo!]!
  todo(id: ID!): Todo
}

type Mutation {
  addTodo(text: String!): Todo!
  toggleTodo(id: ID!): Todo
  deleteTodo(id: ID!): Todo
  updateTodo(id: ID!, text: String, completed: Boolean): Todo
}`,
      resolverKey: '5:todos',
      defaultQuery: `mutation {
  newItem: addTodo(text: "New task") {
    id
    text
  }
  toggled: toggleTodo(id: "1") {
    id
    text
    completed
  }
}`,
      validate: (result) => {
        if (result.data?.newItem?.text && result.data?.toggled) {
          return { pass: true, message: 'Two mutations in one request! They ran sequentially — addTodo first, then toggleTodo.' };
        }
        return { pass: false, message: 'Use aliases to run both addTodo and toggleTodo in one request.' };
      },
      hint: 'Use aliases: newItem: addTodo(...) { } and toggled: toggleTodo(...) { }',
      solution: `mutation {
  newItem: addTodo(text: "New task") {
    id
    text
  }
  toggled: toggleTodo(id: "1") {
    id
    text
    completed
  }
}`,
    },
    {
      type: 'quiz',
      title: 'Mutations Quiz',
      question: 'How do multiple mutations in a single request execute?',
      choices: [
        'In parallel (like queries)',
        'In the order they are written (sequentially)',
        'In random order',
        'Only the first mutation executes',
      ],
      answer: 'In the order they are written (sequentially)',
      successMessage: 'Right! Sequential execution guarantees predictable side effects when mutations depend on each other.',
    },
  ],
},

// ============================================================
// LESSON 6: Enums, Interfaces & Unions
// ============================================================
{
  id: 6,
  title: 'Enums, Interfaces & Unions',
  level: 'intermediate',
  steps: [
    {
      type: 'explain',
      title: 'Enums — Restricted Value Sets',
      content: `
        <p><strong>Enums</strong> restrict a field to a specific set of allowed values.
        No typos, no invalid states — the type system enforces it.</p>
      `,
      code: `enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum Status {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

type Bug {
  title: String!
  severity: Priority!   # Can ONLY be LOW, MEDIUM, HIGH, or CRITICAL
  status: Status!
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: Query with Enums',
      content: `
        <p>Query all bugs and get their <code>title</code>, <code>severity</code>, and <code>assignee</code>.</p>
        <p>Notice how severity values are enum constants — not arbitrary strings.</p>
      `,
      schema: `enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

interface Node {
  id: ID!
  createdAt: String!
}

interface Assignable {
  assignee: String
}

type Bug implements Node & Assignable {
  id: ID!
  createdAt: String!
  title: String!
  severity: Priority!
  assignee: String
  stepsToReproduce: String
}

type Feature implements Node & Assignable {
  id: ID!
  createdAt: String!
  title: String!
  priority: Priority!
  assignee: String
  businessValue: String
}

type Comment implements Node {
  id: ID!
  createdAt: String!
  body: String!
  author: String!
}

union SearchResult = Bug | Feature | Comment

type Query {
  issues: [Node!]!
  bugs: [Bug!]!
  features: [Feature!]!
  search(term: String!): [SearchResult!]!
  issuesByPriority(priority: Priority!): [Assignable!]!
}`,
      resolverKey: '6:issues',
      defaultQuery: `{
  bugs {
    title
    severity
    assignee
  }
}`,
      validate: (result) => {
        if (result.data?.bugs?.[0]?.severity) {
          return { pass: true, message: 'Enums provide type-safe values — no typos possible!' };
        }
        return { pass: false, message: 'Query the bugs field with title, severity, and assignee.' };
      },
    },
    {
      type: 'explain',
      title: 'Interfaces — Shared Contracts',
      content: `
        <p><strong>Interfaces</strong> define a set of fields that multiple types must implement.
        They enable polymorphism — querying different types through a common contract.</p>
      `,
      code: `interface Node {
  id: ID!
  createdAt: String!
}

# Both Bug and Feature MUST have id and createdAt
type Bug implements Node {
  id: ID!             # Required by Node
  createdAt: String!  # Required by Node
  title: String!      # Bug-specific
  severity: Priority!
}

type Feature implements Node {
  id: ID!
  createdAt: String!
  title: String!      # Feature-specific
  priority: Priority!
}`,
    },
    {
      type: 'explain',
      title: 'Inline Fragments — Type-Specific Fields',
      content: `
        <p>When querying an interface, you can only directly access the shared fields.
        To get type-specific fields, use <strong>inline fragments</strong>:</p>
      `,
      code: `{
  issues {
    # Shared fields from Node interface — always available
    id
    createdAt

    # Type-specific fields via inline fragments
    ... on Bug {
      title
      severity
      stepsToReproduce
    }
    ... on Feature {
      title
      priority
      businessValue
    }
    ... on Comment {
      body
      author
    }
  }
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: Query an Interface',
      content: `
        <p>Query <code>issues</code> (which returns the <code>Node</code> interface) and use
        <strong>inline fragments</strong> to get type-specific fields for Bugs, Features, and Comments.</p>
        <p>Include <code>id</code> and <code>createdAt</code> (shared), plus unique fields for each type.</p>
      `,
      schema: `enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

interface Node {
  id: ID!
  createdAt: String!
}

interface Assignable {
  assignee: String
}

type Bug implements Node & Assignable {
  id: ID!
  createdAt: String!
  title: String!
  severity: Priority!
  assignee: String
  stepsToReproduce: String
}

type Feature implements Node & Assignable {
  id: ID!
  createdAt: String!
  title: String!
  priority: Priority!
  assignee: String
  businessValue: String
}

type Comment implements Node {
  id: ID!
  createdAt: String!
  body: String!
  author: String!
}

union SearchResult = Bug | Feature | Comment

type Query {
  issues: [Node!]!
  bugs: [Bug!]!
  features: [Feature!]!
  search(term: String!): [SearchResult!]!
  issuesByPriority(priority: Priority!): [Assignable!]!
}`,
      resolverKey: '6:issues',
      defaultQuery: `{
  issues {
    id
    createdAt
    ... on Bug {
      title
      severity
    }
    ... on Feature {
      title
      priority
    }
    ... on Comment {
      body
      author
    }
  }
}`,
      validate: (result) => {
        const issues = result.data?.issues;
        if (issues && issues.length > 0 && (issues.some(i => i.severity) || issues.some(i => i.priority))) {
          return { pass: true, message: 'You queried multiple types through a shared interface using inline fragments!' };
        }
        return { pass: false, message: 'Use inline fragments: ... on Bug { }, ... on Feature { }, ... on Comment { }' };
      },
      hint: 'Inside issues { }, add: ... on Bug { title severity } ... on Feature { title priority }',
    },
    {
      type: 'explain',
      title: 'Union Types — No Shared Fields',
      content: `
        <p><strong>Unions</strong> are like interfaces but <em>without</em> any guaranteed shared fields.
        A union says "this field returns one of these types":</p>
      `,
      code: `union SearchResult = Bug | Feature | Comment

type Query {
  search(term: String!): [SearchResult!]!
}

# Since unions have NO common fields,
# you MUST use inline fragments for everything:
{
  search(term: "dark") {
    ... on Bug { title severity }
    ... on Feature { title businessValue }
    ... on Comment { body author }
  }
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: Search with Unions',
      content: `
        <p>Use the <code>search</code> query with term <code>"dark"</code> to find matching items.</p>
        <p>Handle all three possible return types with inline fragments.</p>
      `,
      schema: `enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

interface Node {
  id: ID!
  createdAt: String!
}

interface Assignable {
  assignee: String
}

type Bug implements Node & Assignable {
  id: ID!
  createdAt: String!
  title: String!
  severity: Priority!
  assignee: String
  stepsToReproduce: String
}

type Feature implements Node & Assignable {
  id: ID!
  createdAt: String!
  title: String!
  priority: Priority!
  assignee: String
  businessValue: String
}

type Comment implements Node {
  id: ID!
  createdAt: String!
  body: String!
  author: String!
}

union SearchResult = Bug | Feature | Comment

type Query {
  issues: [Node!]!
  bugs: [Bug!]!
  features: [Feature!]!
  search(term: String!): [SearchResult!]!
  issuesByPriority(priority: Priority!): [Assignable!]!
}`,
      resolverKey: '6:issues',
      defaultQuery: `{
  search(term: "dark") {
    ... on Bug {
      title
      severity
    }
    ... on Feature {
      title
      businessValue
    }
    ... on Comment {
      body
      author
    }
  }
}`,
      validate: (result) => {
        const results = result.data?.search;
        if (results && results.length > 0) {
          return { pass: true, message: 'Union types enable powerful polymorphic search results!' };
        }
        return { pass: false, message: 'Search for "dark" with inline fragments for each type.' };
      },
    },
    {
      type: 'quiz',
      title: 'Interfaces vs Unions',
      question: 'What is the key difference between interfaces and unions?',
      choices: [
        'Interfaces are faster than unions',
        'Interfaces define shared fields that types must implement; unions have no shared fields',
        'Unions can only contain two types',
        'There is no difference',
      ],
      answer: 'Interfaces define shared fields that types must implement; unions have no shared fields',
      successMessage: 'Exactly! Use interfaces when types share common fields, unions when they don\'t.',
    },
  ],
},

// ============================================================
// LESSON 7: Directives
// ============================================================
{
  id: 7,
  title: 'Directives',
  level: 'intermediate',
  steps: [
    {
      type: 'explain',
      title: 'Built-in Directives',
      content: `
        <p><strong>Directives</strong> modify how a field or fragment is executed.
        GraphQL has two built-in directives:</p>
        <table class="comparison-table">
          <tr><th>Directive</th><th>Effect</th></tr>
          <tr><td><code>@include(if: Boolean!)</code></td><td>Include this field <strong>only if</strong> condition is true</td></tr>
          <tr><td><code>@skip(if: Boolean!)</code></td><td>Skip this field <strong>if</strong> condition is true</td></tr>
        </table>
        <p>These are controlled by <strong>variables</strong>, making queries dynamic at runtime!</p>
      `,
    },
    {
      type: 'explain',
      title: '@include and @skip in Action',
      content: `
        <p>Directives let clients dynamically control which fields are returned
        without rewriting the query:</p>
      `,
      code: `query GetProducts(
  $showReviews: Boolean!
  $hidePrice: Boolean!
) {
  products {
    name
    price @skip(if: $hidePrice)
    reviews @include(if: $showReviews) {
      rating
      comment
    }
  }
}

# Variables: { "showReviews": true, "hidePrice": false }
# → Shows reviews AND price

# Variables: { "showReviews": false, "hidePrice": true }
# → Hides reviews AND hides price`,
    },
    {
      type: 'playground',
      title: 'Exercise: Conditional Fields with @include',
      content: `
        <p>Write a query that fetches products with:</p>
        <ul>
          <li><code>name</code> and <code>price</code> (always)</li>
          <li><code>description</code> conditionally via <code>@include(if: $withDetails)</code></li>
          <li><code>manufacturer { name country }</code> conditionally via <code>@include(if: $withDetails)</code></li>
        </ul>
        <div class="info-box">Variables <code>{"withDetails": true}</code> will be sent automatically.</div>
      `,
      schema: `type Product {
  id: ID!
  name: String!
  price: Float!
  description: String
  inStock: Boolean!
  reviews: [Review!]!
  manufacturer: Manufacturer
}

type Review {
  id: ID!
  rating: Int!
  comment: String
  author: String!
}

type Manufacturer {
  name: String!
  country: String!
  website: String
}

type Query {
  products: [Product!]!
  product(id: ID!): Product
}`,
      resolverKey: '7:products',
      variables: { withDetails: true },
      defaultQuery: `query GetProducts($withDetails: Boolean!) {
  products {
    name
    price
    description @include(if: $withDetails)
    manufacturer @include(if: $withDetails) {
      name
      country
    }
  }
}`,
      validate: (result) => {
        const prods = result.data?.products;
        if (prods && prods[0]?.name && prods[0]?.manufacturer?.name) {
          return { pass: true, message: 'With $withDetails: true, you get the extra fields! Change it to false and they disappear.' };
        }
        return { pass: false, message: 'Use @include(if: $withDetails) on description and manufacturer.' };
      },
      hint: 'Add @include(if: $withDetails) after description and after manufacturer.',
      solution: `query GetProducts($withDetails: Boolean!) {
  products {
    name
    price
    description @include(if: $withDetails)
    manufacturer @include(if: $withDetails) {
      name
      country
    }
  }
}`,
    },
    {
      type: 'playground',
      title: 'Exercise: @skip Directive',
      content: `
        <p>Now use <code>@skip</code> to conditionally <strong>hide</strong> reviews.</p>
        <p>Query product <code>"p1"</code> with name, price, inStock, and reviews.
        Skip reviews when <code>$compact</code> is true.</p>
        <div class="info-box">Variables <code>{"compact": true}</code> will be sent — reviews should be hidden!</div>
      `,
      schema: `type Product {
  id: ID!
  name: String!
  price: Float!
  description: String
  inStock: Boolean!
  reviews: [Review!]!
  manufacturer: Manufacturer
}

type Review {
  id: ID!
  rating: Int!
  comment: String
  author: String!
}

type Manufacturer {
  name: String!
  country: String!
  website: String
}

type Query {
  products: [Product!]!
  product(id: ID!): Product
}`,
      resolverKey: '7:products',
      variables: { compact: true },
      defaultQuery: `query GetProduct($compact: Boolean!) {
  product(id: "p1") {
    name
    price
    inStock
    reviews @skip(if: $compact) {
      rating
      author
    }
  }
}`,
      validate: (result) => {
        const product = result.data?.product;
        if (product?.name && product?.inStock !== undefined && !product?.reviews) {
          return { pass: true, message: 'Reviews were skipped! @skip(if: true) hides the field entirely from the response.' };
        }
        if (product?.reviews) {
          return { pass: false, message: 'Reviews should be hidden. Use @skip(if: $compact) on the reviews field.' };
        }
        return { pass: false, message: 'Query product "p1" with reviews @skip(if: $compact).' };
      },
    },
    {
      type: 'explain',
      title: 'Directives on Fragments',
      content: `
        <p>You can also apply directives to <strong>inline fragments</strong> to conditionally
        include a whole group of fields:</p>
      `,
      code: `query GetProducts($detailed: Boolean!) {
  products {
    name
    price

    # Conditionally include an ENTIRE group of fields
    ... @include(if: $detailed) {
      description
      inStock
      manufacturer {
        name
        country
        website
      }
    }
  }
}`,
    },
    {
      type: 'quiz',
      title: 'Directive Precedence',
      question: 'What happens if you use @skip(if: true) and @include(if: true) on the same field?',
      choices: [
        'The field is included (@include wins)',
        'The field is skipped (@skip wins)',
        'It causes an error',
        'The field is included because both conditions are met',
      ],
      answer: 'The field is skipped (@skip wins)',
      successMessage: 'Correct! @skip takes precedence — it acts as a veto regardless of @include.',
      hint: 'Think of @skip as a veto — it overrides @include.',
    },
  ],
},

]; // end LESSONS
