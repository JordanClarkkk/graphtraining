import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 5,
  title: 'Mutations',
  level: 'intermediate',
  description: 'Learn to modify data with GraphQL mutations.',
};

let todos = [
  { id: '1', text: 'Learn GraphQL basics', completed: true, createdAt: '2024-01-01' },
  { id: '2', text: 'Master mutations', completed: false, createdAt: '2024-01-02' },
  { id: '3', text: 'Build a real API', completed: false, createdAt: '2024-01-03' },
];
let nextId = 4;

function resetTodos() {
  todos = [
    { id: '1', text: 'Learn GraphQL basics', completed: true, createdAt: '2024-01-01' },
    { id: '2', text: 'Master mutations', completed: false, createdAt: '2024-01-02' },
    { id: '3', text: 'Build a real API', completed: false, createdAt: '2024-01-03' },
  ];
  nextId = 4;
}

const schema = `type Todo {
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
}`;

const resolvers = {
  Query: {
    todos: () => todos,
    todo: (_, { id }) => todos.find(t => t.id === id),
  },
  Mutation: {
    addTodo: (_, { text }) => {
      const todo = { id: String(nextId++), text, completed: false, createdAt: new Date().toISOString().split('T')[0] };
      todos.push(todo);
      return todo;
    },
    toggleTodo: (_, { id }) => {
      const todo = todos.find(t => t.id === id);
      if (todo) todo.completed = !todo.completed;
      return todo;
    },
    deleteTodo: (_, { id }) => {
      const idx = todos.findIndex(t => t.id === id);
      if (idx === -1) return null;
      return todos.splice(idx, 1)[0];
    },
    updateTodo: (_, { id, text, completed }) => {
      const todo = todos.find(t => t.id === id);
      if (!todo) return null;
      if (text !== undefined) todo.text = text;
      if (completed !== undefined) todo.completed = completed;
      return todo;
    },
  },
};

export async function run() {
  resetTodos();

  await explainStep({
    title: 'Mutations — Modifying Data',
    explanation: [
      'While queries READ data, mutations WRITE data.',
      'Mutations can create, update, or delete data.',
      '',
      'Convention: mutations are defined in a Mutation type, separate from Query.',
    ],
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
  });

  await explainStep({
    title: 'Mutation Response Pattern',
    explanation: [
      'A key GraphQL pattern: mutations RETURN the modified data.',
      'This means your UI can update immediately without a second request.',
      '',
      'When you create a todo, the mutation returns the new todo.',
      'When you update a todo, the mutation returns the updated todo.',
      'When you delete a todo, the mutation returns the deleted todo.',
      '',
      'You choose what fields to get back — just like a query!',
    ],
  });

  await queryPlayground({
    title: 'Exercise: Create a Todo',
    explanation: [
      'Write a mutation to add a new todo with the text "Practice GraphQL".',
      'Request back the id, text, and completed fields.',
    ],
    schema,
    resolvers,
    defaultQuery: `mutation {
  addTodo(text: "Practice GraphQL") {
    id
    text
    completed
  }
}`,
    validate: (result) => {
      if (result.data?.addTodo?.text === 'Practice GraphQL') {
        return { pass: true, message: 'Todo created! Notice it returned the new todo with an auto-generated id.' };
      }
      return { pass: false, message: 'Use: mutation { addTodo(text: "Practice GraphQL") { id text completed } }' };
    },
  });

  resetTodos();

  await queryPlayground({
    title: 'Exercise: Toggle a Todo',
    explanation: [
      'Todo #2 ("Master mutations") is currently incomplete.',
      'Write a mutation to toggle it to completed.',
      'Get back the id, text, and completed fields.',
    ],
    schema,
    resolvers,
    defaultQuery: `mutation {
  toggleTodo(id: "2") {
    id
    text
    completed
  }
}`,
    validate: (result) => {
      if (result.data?.toggleTodo?.completed === true) {
        return { pass: true, message: 'Todo toggled! The completed field is now true.' };
      }
      return { pass: false, message: 'Toggle todo with id "2": mutation { toggleTodo(id: "2") { id text completed } }' };
    },
  });

  resetTodos();

  await explainStep({
    title: 'Input Types',
    explanation: [
      'For mutations with many parameters, use Input types to group them:',
    ],
    code: `# Instead of many arguments:
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
  });

  await queryPlayground({
    title: 'Exercise: Chained Operations',
    explanation: [
      'You can run multiple mutations in sequence in a single request.',
      'GraphQL executes mutations in order (unlike queries which can run in parallel).',
      '',
      'Add a new todo AND toggle todo #1 in a single request.',
      'Use aliases to distinguish the results.',
    ],
    schema,
    resolvers,
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
        return { pass: true, message: 'Two mutations in one request! Note: mutations execute sequentially.' };
      }
      return { pass: false, message: 'Use aliases to run both addTodo and toggleTodo in one request.' };
    },
  });

  await quizStep({
    question: 'How do multiple mutations in a single request execute?',
    choices: [
      'In parallel (like queries)',
      'In the order they are written (sequentially)',
      'In random order',
      'Only the first mutation executes',
    ],
    answer: 'In the order they are written (sequentially)',
    successMessage: 'Right! This guarantees predictable side effects when mutations depend on each other.',
  });
}
