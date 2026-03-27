import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 4,
  title: 'Fragments & Variables',
  level: 'beginner',
  description: 'Reuse query parts with fragments and parameterize queries with variables.',
};

const schema = `type User {
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
}`;

const users = [
  { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'Admin', department: 'Engineering' },
  { id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'Developer', department: 'Engineering' },
  { id: 'u3', name: 'Charlie', email: 'charlie@example.com', role: 'Designer', department: 'Design' },
];

const tasks = [
  { id: 't1', title: 'Build login page', status: 'done', assigneeId: 'u2', priority: 'high' },
  { id: 't2', title: 'Design dashboard', status: 'in_progress', assigneeId: 'u3', priority: 'high' },
  { id: 't3', title: 'Fix API bug', status: 'todo', assigneeId: 'u2', priority: 'critical' },
  { id: 't4', title: 'Write tests', status: 'in_progress', assigneeId: 'u1', priority: 'medium' },
];

const resolvers = {
  Query: {
    users: () => users,
    user: (_, { id }) => users.find(u => u.id === id),
    tasks: (_, { status }) => status ? tasks.filter(t => t.status === status) : tasks,
    task: (_, { id }) => tasks.find(t => t.id === id),
  },
  Task: {
    assignee: (task) => users.find(u => u.id === task.assigneeId),
  },
};

export async function run() {
  await explainStep({
    title: 'Fragments — Reusable Field Sets',
    explanation: [
      'Fragments let you define a set of fields once and reuse them:',
    ],
    code: `# Without fragments — lots of repetition:
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

# With fragments — DRY and clean:
fragment TaskDetails on Task {
  title
  status
  priority
  assignee {
    name
    email
    role
  }
}

{
  task1: task(id: "t1") { ...TaskDetails }
  task2: task(id: "t2") { ...TaskDetails }
}`,
  });

  await queryPlayground({
    title: 'Exercise: Using Fragments',
    explanation: [
      'Create a fragment called "UserInfo" on the User type with: name, email, role.',
      'Then use it to query two users: user "u1" (alias: admin) and user "u2" (alias: dev).',
    ],
    schema,
    resolvers,
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
        return { pass: true, message: 'Fragments make your queries clean and reusable!' };
      }
      return { pass: false, message: 'Add a second aliased query for user "u2" using the fragment.' };
    },
    hint: 'Add: dev: user(id: "u2") { ...UserInfo }',
  });

  await explainStep({
    title: 'Variables — Parameterized Queries',
    explanation: [
      'In real apps, you don\'t hardcode values in queries.',
      'Variables let you pass dynamic values separately:',
    ],
    code: `# Query with a variable declaration
query GetTask($taskId: ID!) {
  task(id: $taskId) {
    title
    status
  }
}

# Variables (sent as JSON alongside the query):
# { "taskId": "t1" }

# The $taskId variable is substituted at runtime.
# This is how client libraries like Apollo send queries.`,
  });

  await explainStep({
    title: 'Variable Syntax',
    explanation: [
      'Variable rules:',
      '  1. Declared in the operation definition: query MyQuery($var: Type!)',
      '  2. Used with $ prefix: field(arg: $var)',
      '  3. Can have default values: query MyQuery($limit: Int = 10)',
      '',
      'Benefits of variables:',
      '  • Prevents string interpolation (no injection attacks!)',
      '  • Enables query caching',
      '  • Cleaner, more maintainable code',
    ],
    code: `# Named query with multiple variables and a default
query GetTasks($status: String, $limit: Int = 10) {
  tasks(status: $status) {
    title
    priority
    assignee {
      name
    }
  }
}`,
  });

  await queryPlayground({
    title: 'Exercise: Named Query with Variables',
    explanation: [
      'Write a named query called "GetTasksByStatus" that:',
      '  • Accepts a $status variable (optional String)',
      '  • Returns tasks filtered by status',
      '  • Includes title, status, priority, and assignee name',
      '',
      'The variable {"status": "in_progress"} will be passed automatically.',
    ],
    schema,
    resolvers,
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
        return { pass: true, message: 'You used variables to parameterize a query!' };
      }
      if (tasks && tasks.every(t => t.status === 'in_progress')) {
        return { pass: false, message: 'Almost! Also include the priority and assignee { name } fields.' };
      }
      return { pass: false, message: 'Make sure your query uses $status and includes all required fields.' };
    },
    hint: 'Add priority and assignee { name } to your selection set.',
  });

  await quizStep({
    question: 'Why should you use variables instead of string interpolation in GraphQL?',
    choices: [
      'Variables are faster to type',
      'They prevent injection attacks and enable query caching',
      'GraphQL doesn\'t support string values',
      'Variables are only needed for mutations',
    ],
    answer: 'They prevent injection attacks and enable query caching',
    successMessage: 'Exactly! Variables are safer and more performant.',
  });
}
