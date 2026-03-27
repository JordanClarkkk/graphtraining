import { explainStep, quizStep, queryPlayground, schemaPlayground } from '../engine/interactive.js';

export const meta = {
  id: 6,
  title: 'Enums, Interfaces & Unions',
  level: 'intermediate',
  description: 'Advanced type system features for modeling complex domains.',
};

const schema = `enum Priority {
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
}`;

const bugs = [
  { id: 'b1', createdAt: '2024-01-10', title: 'Login button broken', severity: 'CRITICAL', assignee: 'Alice', stepsToReproduce: 'Click login, see error' },
  { id: 'b2', createdAt: '2024-01-12', title: 'CSS misalignment on mobile', severity: 'LOW', assignee: null, stepsToReproduce: 'Open on iPhone' },
];

const features = [
  { id: 'f1', createdAt: '2024-01-08', title: 'Dark mode', priority: 'HIGH', assignee: 'Bob', businessValue: 'User retention' },
  { id: 'f2', createdAt: '2024-01-15', title: 'Export to PDF', priority: 'MEDIUM', assignee: 'Charlie', businessValue: 'Enterprise clients' },
];

const comments = [
  { id: 'c1', createdAt: '2024-01-11', body: 'This is blocking deployment', author: 'Alice' },
  { id: 'c2', createdAt: '2024-01-13', body: 'Dark mode would be great!', author: 'Dave' },
];

const allItems = [...bugs, ...features, ...comments];

const resolvers = {
  Query: {
    issues: () => [...bugs, ...features, ...comments],
    bugs: () => bugs,
    features: () => features,
    search: (_, { term }) => allItems.filter(i =>
      (i.title || i.body || '').toLowerCase().includes(term.toLowerCase())
    ),
    issuesByPriority: (_, { priority }) => [
      ...bugs.filter(b => b.severity === priority),
      ...features.filter(f => f.priority === priority),
    ],
  },
  Node: {
    __resolveType(obj) {
      if (obj.severity) return 'Bug';
      if (obj.businessValue) return 'Feature';
      return 'Comment';
    },
  },
  Assignable: {
    __resolveType(obj) {
      if (obj.severity) return 'Bug';
      return 'Feature';
    },
  },
  SearchResult: {
    __resolveType(obj) {
      if (obj.severity) return 'Bug';
      if (obj.businessValue) return 'Feature';
      return 'Comment';
    },
  },
};

export async function run() {
  await explainStep({
    title: 'Enums',
    explanation: [
      'Enums restrict a field to a specific set of values:',
    ],
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
  severity: Priority!  # Can only be LOW, MEDIUM, HIGH, or CRITICAL
  status: Status!
}`,
  });

  await queryPlayground({
    title: 'Exercise: Query with Enums',
    explanation: [
      'Query all bugs and get their title, severity, and assignee.',
      'Note how severity values are enum values (not strings).',
    ],
    schema,
    resolvers,
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
  });

  await explainStep({
    title: 'Interfaces',
    explanation: [
      'Interfaces define a set of fields that multiple types must implement.',
      'They enable polymorphism — querying different types through a common contract.',
    ],
    code: `interface Node {
  id: ID!
  createdAt: String!
}

# Both Bug and Feature implement Node
type Bug implements Node {
  id: ID!          # Required by Node
  createdAt: String!  # Required by Node
  title: String!      # Bug-specific
  severity: Priority!
}

type Feature implements Node {
  id: ID!
  createdAt: String!
  title: String!
  priority: Priority!
}`,
  });

  await explainStep({
    title: 'Inline Fragments',
    explanation: [
      'When querying an interface or union, use inline fragments',
      'to access type-specific fields:',
    ],
    code: `{
  issues {
    # Common fields from the Node interface
    id
    createdAt

    # Type-specific fields using inline fragments
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
  });

  await queryPlayground({
    title: 'Exercise: Query an Interface',
    explanation: [
      'Query "issues" (which returns the Node interface) and use inline',
      'fragments to get type-specific fields for Bugs, Features, and Comments.',
    ],
    schema,
    resolvers,
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
        return { pass: true, message: 'You queried multiple types through a shared interface!' };
      }
      return { pass: false, message: 'Use inline fragments (... on Type { fields }) to access type-specific data.' };
    },
  });

  await explainStep({
    title: 'Union Types',
    explanation: [
      'Unions are like interfaces but WITHOUT shared fields.',
      'A union says "this field returns one of these types":',
    ],
    code: `union SearchResult = Bug | Feature | Comment

type Query {
  search(term: String!): [SearchResult!]!
}

# Since unions have no guaranteed common fields,
# you MUST use inline fragments for everything:
{
  search(term: "dark") {
    ... on Bug { title severity }
    ... on Feature { title businessValue }
    ... on Comment { body author }
  }
}`,
  });

  await queryPlayground({
    title: 'Exercise: Search with Union Types',
    explanation: [
      'Use the search query with term "dark" to find matching items.',
      'Handle all three possible types with inline fragments.',
    ],
    schema,
    resolvers,
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
  });

  await quizStep({
    question: 'What is the key difference between interfaces and unions?',
    choices: [
      'Interfaces are faster than unions',
      'Interfaces define shared fields that types must implement; unions have no shared fields',
      'Unions can only contain two types',
      'There is no difference',
    ],
    answer: 'Interfaces define shared fields that types must implement; unions have no shared fields',
    successMessage: 'Exactly! Use interfaces when types share common fields, unions when they don\'t.',
  });
}
