import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 7,
  title: 'Directives',
  level: 'intermediate',
  description: 'Control query execution with @include, @skip, and custom directives.',
};

const schema = `type Product {
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
}`;

const manufacturers = [
  { name: 'TechCorp', country: 'USA', website: 'https://techcorp.example.com' },
  { name: 'GadgetWorld', country: 'Japan', website: 'https://gadgetworld.example.com' },
];

const reviews = [
  { id: 'r1', rating: 5, comment: 'Amazing product!', author: 'Alice' },
  { id: 'r2', rating: 3, comment: null, author: 'Bob' },
  { id: 'r3', rating: 4, comment: 'Good value', author: 'Charlie' },
];

const products = [
  { id: 'p1', name: 'Wireless Mouse', price: 29.99, description: 'Ergonomic design', inStock: true, reviews: [reviews[0], reviews[1]], manufacturer: manufacturers[0] },
  { id: 'p2', name: 'Mechanical Keyboard', price: 89.99, description: 'Cherry MX switches', inStock: false, reviews: [reviews[2]], manufacturer: manufacturers[1] },
  { id: 'p3', name: 'USB-C Hub', price: 49.99, description: null, inStock: true, reviews: [], manufacturer: manufacturers[0] },
];

const resolvers = {
  Query: {
    products: () => products,
    product: (_, { id }) => products.find(p => p.id === id),
  },
};

export async function run() {
  await explainStep({
    title: 'Built-in Directives',
    explanation: [
      'Directives modify how a field or fragment is executed.',
      'GraphQL has two built-in directives:',
      '',
      '  @include(if: Boolean!) — Include field only if condition is true',
      '  @skip(if: Boolean!)    — Skip field if condition is true',
      '',
      'These are controlled by variables, making queries dynamic!',
    ],
  });

  await explainStep({
    title: '@include and @skip in Action',
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
# → Shows reviews, shows price

# Variables: { "showReviews": false, "hidePrice": true }
# → Hides reviews, hides price`,
  });

  await queryPlayground({
    title: 'Exercise: Conditional Fields with @include',
    explanation: [
      'Write a query that fetches products with:',
      '  • name and price (always)',
      '  • description @include(if: $withDetails)',
      '  • manufacturer { name country } @include(if: $withDetails)',
      '',
      'Variables { "withDetails": true } will be passed.',
    ],
    schema,
    resolvers,
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
        return { pass: true, message: 'With $withDetails: true, you get the extra data!' };
      }
      return { pass: false, message: 'Use @include(if: $withDetails) on description and manufacturer.' };
    },
  });

  await queryPlayground({
    title: 'Exercise: @skip Directive',
    explanation: [
      'Now use @skip to conditionally HIDE the reviews.',
      'Query product "p1" with name, price, inStock, and reviews.',
      'Skip reviews when $compact is true.',
      '',
      'Variables { "compact": true } will be passed.',
    ],
    schema,
    resolvers,
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
        return { pass: true, message: 'Reviews were skipped! @skip(if: true) hides the field.' };
      }
      if (product?.reviews) {
        return { pass: false, message: 'Reviews should be hidden when $compact is true. Use @skip(if: $compact).' };
      }
      return { pass: false, message: 'Query product "p1" with reviews @skip(if: $compact).' };
    },
  });

  await explainStep({
    title: 'Directives on Fragments',
    explanation: [
      'You can also apply directives to inline fragments:',
    ],
    code: `query GetProducts($detailed: Boolean!) {
  products {
    name
    price
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
}

# This conditionally includes a whole GROUP of fields!`,
  });

  await quizStep({
    question: 'What happens if you use @skip(if: true) and @include(if: true) on the same field?',
    choices: [
      'The field is included (include wins)',
      'The field is skipped (skip wins)',
      'It causes an error',
      'The field is included because both conditions are met',
    ],
    answer: 'The field is skipped (skip wins)',
    successMessage: 'Correct! @skip takes precedence — if skip is true, the field is excluded regardless of @include.',
    hint: 'Think of @skip as a veto — it overrides @include.',
  });
}
