import { explainStep, quizStep, schemaPlayground, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 14,
  title: 'Schema Design Best Practices',
  level: 'advanced',
  description: 'Design production-quality schemas — naming, patterns, and conventions.',
};

export async function run() {
  await explainStep({
    title: 'Schema Design Matters',
    explanation: [
      'Your GraphQL schema is a public API contract. Once clients depend on it,',
      'changes are hard. Good design upfront saves pain later.',
      '',
      'Key principles:',
      '  1. Design for the client, not the database',
      '  2. Use clear, consistent naming',
      '  3. Make illegal states unrepresentable',
      '  4. Plan for evolution',
    ],
  });

  await explainStep({
    title: 'Naming Conventions',
    code: `# Types: PascalCase
type ShoppingCart { ... }
type OrderItem { ... }

# Fields: camelCase
type User {
  firstName: String!
  lastName: String!
  createdAt: DateTime!
}

# Enums: SCREAMING_SNAKE_CASE values
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

# Mutations: verb + noun
type Mutation {
  createOrder(input: CreateOrderInput!): CreateOrderPayload!
  cancelOrder(id: ID!): CancelOrderPayload!
  addItemToCart(input: AddItemToCartInput!): Cart!
}

# Input types: suffixed with "Input"
input CreateOrderInput {
  items: [OrderItemInput!]!
  shippingAddress: AddressInput!
}`,
  });

  await explainStep({
    title: 'Mutation Payload Pattern',
    explanation: [
      'Best practice: Return a payload type from mutations, not just the entity.',
      'This lets you include metadata, errors, and the modified entity:',
    ],
    code: `# Bad: Just returns the entity
type Mutation {
  createUser(name: String!, email: String!): User
}

# Good: Returns a payload with the entity + metadata
type CreateUserPayload {
  user: User
  success: Boolean!
  errors: [UserError!]!
}

type UserError {
  field: String!
  message: String!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
}

# Usage:
mutation {
  createUser(input: { name: "Alice", email: "invalid" }) {
    success
    user { id name }
    errors { field message }
  }
}`,
  });

  const ecomSchema = `input AddressInput {
  street: String!
  city: String!
  state: String!
  zip: String!
  country: String!
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

type Address {
  street: String!
  city: String!
  state: String!
  zip: String!
  country: String!
}

type Product {
  id: ID!
  name: String!
  price: Float!
  inStock: Boolean!
}

type OrderItem {
  product: Product!
  quantity: Int!
  subtotal: Float!
}

type Order {
  id: ID!
  items: [OrderItem!]!
  status: OrderStatus!
  totalAmount: Float!
  shippingAddress: Address!
  createdAt: String!
}

type OrderPayload {
  success: Boolean!
  order: Order
  errors: [String!]!
}

type Query {
  products: [Product!]!
  order(id: ID!): Order
  myOrders: [Order!]!
}

type Mutation {
  placeOrder(productIds: [ID!]!, shippingAddress: AddressInput!): OrderPayload!
}`;

  const products = [
    { id: 'prod1', name: 'Wireless Mouse', price: 29.99, inStock: true },
    { id: 'prod2', name: 'Keyboard', price: 89.99, inStock: true },
    { id: 'prod3', name: 'Monitor', price: 349.99, inStock: false },
  ];

  const orders = [
    {
      id: 'ord1',
      items: [
        { product: products[0], quantity: 1, subtotal: 29.99 },
        { product: products[1], quantity: 1, subtotal: 89.99 },
      ],
      status: 'DELIVERED',
      totalAmount: 119.98,
      shippingAddress: { street: '123 Main St', city: 'Springfield', state: 'IL', zip: '62701', country: 'US' },
      createdAt: '2024-01-15T10:30:00Z',
    },
  ];

  const ecomResolvers = {
    Query: {
      products: () => products,
      order: (_, { id }) => orders.find(o => o.id === id),
      myOrders: () => orders,
    },
    Mutation: {
      placeOrder: (_, { productIds, shippingAddress }) => {
        const orderProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean);
        const outOfStock = orderProducts.filter(p => !p.inStock);

        if (outOfStock.length > 0) {
          return {
            success: false,
            order: null,
            errors: outOfStock.map(p => `${p.name} is out of stock`),
          };
        }

        const items = orderProducts.map(p => ({ product: p, quantity: 1, subtotal: p.price }));
        const order = {
          id: 'ord' + (orders.length + 1),
          items,
          status: 'PENDING',
          totalAmount: items.reduce((sum, i) => sum + i.subtotal, 0),
          shippingAddress,
          createdAt: new Date().toISOString(),
        };
        orders.push(order);

        return { success: true, order, errors: [] };
      },
    },
  };

  await queryPlayground({
    title: 'Exercise: E-Commerce Schema',
    explanation: [
      'Explore this well-designed e-commerce schema.',
      'Query the available products and your past orders.',
    ],
    schema: ecomSchema,
    resolvers: ecomResolvers,
    defaultQuery: `{
  products {
    id
    name
    price
    inStock
  }
  myOrders {
    id
    status
    totalAmount
    items {
      product { name }
      quantity
      subtotal
    }
  }
}`,
    validate: (result) => {
      if (result.data?.products?.length > 0 && result.data?.myOrders) {
        return { pass: true, message: 'Notice the clean schema design — clear types, enums for status, structured addresses.' };
      }
      return { pass: false, message: 'Query both products and myOrders.' };
    },
  });

  await queryPlayground({
    title: 'Exercise: Mutation Payload Pattern',
    explanation: [
      'Try placing an order that includes an out-of-stock product (prod3 - Monitor).',
      'See how the payload pattern handles the error gracefully.',
    ],
    schema: ecomSchema,
    resolvers: ecomResolvers,
    defaultQuery: `mutation {
  placeOrder(
    productIds: ["prod1", "prod3"]
    shippingAddress: {
      street: "456 Oak Ave"
      city: "Portland"
      state: "OR"
      zip: "97201"
      country: "US"
    }
  ) {
    success
    order {
      id
      totalAmount
    }
    errors
  }
}`,
    validate: (result) => {
      const payload = result.data?.placeOrder;
      if (payload && !payload.success && payload.errors?.length > 0) {
        return { pass: true, message: 'The payload pattern gives structured errors instead of throwing. Much better for the client!' };
      }
      if (payload?.success) {
        return { pass: false, message: 'Try including "prod3" (out of stock) to see the error handling.' };
      }
      return { pass: false, message: 'Run the mutation to see the payload error pattern in action.' };
    },
  });

  await explainStep({
    title: 'Schema Evolution',
    explanation: [
      'Unlike REST (v1, v2, v3...), GraphQL schemas evolve without versioning:',
      '',
      '  Adding fields     → Always safe (existing queries aren\'t affected)',
      '  Deprecating fields → Use @deprecated directive',
      '  Removing fields   → Only after deprecation period',
      '',
      'The @deprecated directive:',
    ],
    code: `type User {
  id: ID!
  name: String!
  fullName: String!

  # Old field — clients should migrate to fullName
  firstName: String! @deprecated(reason: "Use 'fullName' instead")
  lastName: String! @deprecated(reason: "Use 'fullName' instead")
}`,
  });

  await quizStep({
    question: 'What\'s the recommended way to version a GraphQL API?',
    choices: [
      'Use /v1/graphql, /v2/graphql endpoints',
      'Include version in the query: query @version(2)',
      'Don\'t version — evolve the schema by adding fields and deprecating old ones',
      'Create a new schema for each version',
    ],
    answer: 'Don\'t version — evolve the schema by adding fields and deprecating old ones',
    successMessage: 'Correct! GraphQL\'s type system allows continuous evolution without breaking existing clients.',
  });
}
