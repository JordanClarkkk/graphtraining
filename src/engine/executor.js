import { graphql, buildSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';

/**
 * Executes a GraphQL query against a schema definition and resolvers.
 * Returns { data, errors } or { error } for build/parse failures.
 */
export async function executeGraphQL({ typeDefs, resolvers, query, variables }) {
  try {
    let schema;
    if (resolvers && Object.keys(resolvers).length > 0) {
      schema = makeExecutableSchema({ typeDefs, resolvers });
    } else {
      schema = buildSchema(typeDefs);
    }

    const result = await graphql({
      schema,
      source: query,
      variableValues: variables || {},
      rootValue: resolvers?._rootValue || {},
    });

    return result;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Validates a schema definition string without executing anything.
 */
export function validateSchema(typeDefs) {
  try {
    buildSchema(typeDefs);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Parses a query against a schema to check for syntax/validation errors.
 */
export async function validateQuery({ typeDefs, query }) {
  try {
    const schema = buildSchema(typeDefs);
    const result = await graphql({ schema, source: query });
    if (result.errors) {
      return { valid: false, errors: result.errors.map(e => e.message) };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}
