import { explainStep, quizStep, queryPlayground } from '../engine/interactive.js';

export const meta = {
  id: 13,
  title: 'Subscriptions & Real-time Data',
  level: 'advanced',
  description: 'Learn about GraphQL subscriptions for real-time updates.',
};

export async function run() {
  await explainStep({
    title: 'GraphQL Subscriptions',
    explanation: [
      'Subscriptions are GraphQL\'s answer to real-time data.',
      '',
      '  Query        → "Give me data now" (one-time request)',
      '  Mutation      → "Change this data" (one-time write)',
      '  Subscription  → "Notify me when data changes" (persistent connection)',
      '',
      'Subscriptions use WebSockets (or SSE) to maintain a live connection.',
      'When data changes on the server, it pushes updates to subscribed clients.',
    ],
  });

  await explainStep({
    title: 'Subscription Schema',
    code: `type Message {
  id: ID!
  text: String!
  sender: User!
  createdAt: String!
}

type Subscription {
  messageAdded(channelId: ID!): Message!
  userTyping(channelId: ID!): User!
  onlineStatusChanged: User!
}

# Client subscribes:
subscription OnNewMessage {
  messageAdded(channelId: "general") {
    id
    text
    sender {
      name
    }
    createdAt
  }
}`,
  });

  await explainStep({
    title: 'How Subscriptions Work',
    explanation: [
      'The flow:',
      '',
      '  1. Client sends a subscription query over WebSocket',
      '  2. Server registers the subscription',
      '  3. When relevant data changes (e.g., new message created)',
      '     the server pushes the update to ALL subscribed clients',
      '  4. Client receives real-time updates',
      '  5. Client can unsubscribe to stop receiving updates',
    ],
    code: `// Server-side: Publishing events
const resolvers = {
  Mutation: {
    sendMessage: async (_, { channelId, text }, { pubsub, currentUser }) => {
      const message = {
        id: generateId(),
        text,
        sender: currentUser,
        createdAt: new Date().toISOString(),
      };

      // Save to database
      await db.messages.create(message);

      // Publish to all subscribers
      pubsub.publish('MESSAGE_ADDED', {
        messageAdded: message,
      });

      return message;
    },
  },

  Subscription: {
    messageAdded: {
      // Filter: only send to subscribers of this channel
      subscribe: (_, { channelId }, { pubsub }) =>
        pubsub.asyncIterator(['MESSAGE_ADDED']),
      // Optional: filter which events reach which subscribers
      // filter: (payload, variables) =>
      //   payload.channelId === variables.channelId,
    },
  },
};`,
    language: 'graphql',
  });

  await explainStep({
    title: 'Client-Side Subscriptions',
    code: `// Apollo Client subscription
import { useSubscription, gql } from '@apollo/client';

const NEW_MESSAGE = gql\`
  subscription OnNewMessage($channelId: ID!) {
    messageAdded(channelId: $channelId) {
      id
      text
      sender { name }
      createdAt
    }
  }
\`;

function ChatRoom({ channelId }) {
  const { data, loading } = useSubscription(NEW_MESSAGE, {
    variables: { channelId },
  });

  // data.messageAdded updates in real-time!
  if (data) {
    console.log('New message:', data.messageAdded.text);
  }

  return <div>...</div>;
}`,
    language: 'graphql',
  });

  await explainStep({
    title: 'PubSub Pattern',
    explanation: [
      'Subscriptions rely on a Publish/Subscribe (PubSub) system:',
      '',
      '  pubsub.publish(EVENT_NAME, payload)  — Trigger an event',
      '  pubsub.asyncIterator([EVENT_NAME])    — Listen for events',
      '',
      'PubSub implementations:',
      '  • In-memory PubSub     — Dev only (single server)',
      '  • Redis PubSub         — Production (multi-server)',
      '  • Google Cloud PubSub  — Scalable cloud option',
      '  • Kafka                — High-throughput streaming',
      '',
      'Important: In-memory PubSub only works with a single server.',
      'For production with multiple servers, use Redis or similar.',
    ],
  });

  // We can still test the schema definition part
  const chatSchema = `type User {
  id: ID!
  name: String!
  online: Boolean!
}

type Message {
  id: ID!
  text: String!
  sender: User!
  channelId: ID!
  createdAt: String!
}

type Channel {
  id: ID!
  name: String!
  messages: [Message!]!
  members: [User!]!
}

type Query {
  channel(id: ID!): Channel
  channels: [Channel!]!
}

type Mutation {
  sendMessage(channelId: ID!, text: String!): Message!
}`;

  const chatUsers = [
    { id: 'u1', name: 'Alice', online: true },
    { id: 'u2', name: 'Bob', online: true },
    { id: 'u3', name: 'Charlie', online: false },
  ];

  const messages = [
    { id: 'm1', text: 'Hello everyone!', sender: chatUsers[0], channelId: 'ch1', createdAt: '2024-01-01T10:00:00Z' },
    { id: 'm2', text: 'Hey Alice!', sender: chatUsers[1], channelId: 'ch1', createdAt: '2024-01-01T10:01:00Z' },
    { id: 'm3', text: 'Working on the API', sender: chatUsers[0], channelId: 'ch2', createdAt: '2024-01-01T10:02:00Z' },
  ];

  const channels = [
    { id: 'ch1', name: 'general', messages: messages.filter(m => m.channelId === 'ch1'), members: chatUsers },
    { id: 'ch2', name: 'dev', messages: messages.filter(m => m.channelId === 'ch2'), members: [chatUsers[0], chatUsers[1]] },
  ];

  const chatResolvers = {
    Query: {
      channel: (_, { id }) => channels.find(c => c.id === id),
      channels: () => channels,
    },
    Mutation: {
      sendMessage: (_, { channelId, text }) => {
        const msg = {
          id: `m${messages.length + 1}`,
          text,
          sender: chatUsers[0],
          channelId,
          createdAt: new Date().toISOString(),
        };
        messages.push(msg);
        const ch = channels.find(c => c.id === channelId);
        if (ch) ch.messages.push(msg);
        return msg;
      },
    },
  };

  await queryPlayground({
    title: 'Exercise: Chat App Queries',
    explanation: [
      'This is a chat app schema. Query the "general" channel (id: "ch1"):',
      '  • Channel name and members (name, online status)',
      '  • Messages with text, sender name, and timestamp',
    ],
    schema: chatSchema,
    resolvers: chatResolvers,
    defaultQuery: `{
  channel(id: "ch1") {
    name
    members {
      name
      online
    }
    messages {
      text
      sender {
        name
      }
      createdAt
    }
  }
}`,
    validate: (result) => {
      const ch = result.data?.channel;
      if (ch?.name === 'general' && ch?.members?.length > 0 && ch?.messages?.length > 0) {
        return { pass: true, message: 'In a real app, you\'d combine this query with a subscription to get real-time message updates!' };
      }
      return { pass: false, message: 'Query channel "ch1" with members and messages.' };
    },
  });

  await quizStep({
    question: 'What transport protocol do GraphQL subscriptions typically use?',
    choices: [
      'HTTP (same as queries)',
      'WebSockets (persistent connection)',
      'FTP',
      'gRPC',
    ],
    answer: 'WebSockets (persistent connection)',
    successMessage: 'Correct! WebSockets provide the persistent bidirectional connection needed for real-time updates.',
  });

  await quizStep({
    question: 'Why shouldn\'t you use in-memory PubSub in production?',
    choices: [
      'It\'s too slow',
      'It only works on a single server — not across multiple instances',
      'It doesn\'t support filtering',
      'It requires too much RAM',
    ],
    answer: 'It only works on a single server — not across multiple instances',
    successMessage: 'Right! In production with multiple servers, you need Redis or a distributed PubSub system.',
  });
}
