import inquirer from 'inquirer';
import chalk from 'chalk';
import { executeGraphQL, validateSchema } from './executor.js';
import {
  renderCode, renderResult, renderExplanation, renderHint,
  renderSuccess, renderError, renderSubtitle, renderDivider
} from './renderer.js';

/**
 * Present an explanation step — just show text, press enter to continue.
 */
export async function explainStep(step) {
  if (step.title) renderSubtitle(step.title);
  if (step.explanation) renderExplanation(step.explanation);
  if (step.code) renderCode(step.code, step.language || 'graphql');

  await inquirer.prompt([{
    type: 'input',
    name: '_',
    message: chalk.dim('Press Enter to continue...'),
  }]);
}

/**
 * Let the user write/edit a query and run it against a schema.
 * Shows the result (data or errors) and optionally validates the output.
 */
export async function queryPlayground(step) {
  if (step.title) renderSubtitle(step.title);
  if (step.explanation) renderExplanation(step.explanation);

  if (step.schema) {
    console.log(chalk.dim.bold('  Schema:'));
    renderCode(step.schema, 'graphql');
  }

  let passed = false;
  while (!passed) {
    const defaultQuery = step.defaultQuery || '{\n  \n}';
    console.log(chalk.dim('  Edit the query below (the default is pre-filled):'));

    const { query } = await inquirer.prompt([{
      type: 'editor',
      name: 'query',
      message: 'Write your GraphQL query:',
      default: defaultQuery,
      waitForUseInput: false,
    }]);

    console.log(chalk.dim.bold('\n  Your query:'));
    renderCode(query.trim(), 'graphql');

    const result = await executeGraphQL({
      typeDefs: step.schema,
      resolvers: step.resolvers || {},
      query: query.trim(),
      variables: step.variables,
    });

    renderResult(result);

    if (step.validate) {
      const validation = step.validate(result, query.trim());
      if (validation.pass) {
        renderSuccess(validation.message || 'Correct!');
        passed = true;
      } else {
        renderError(validation.message || 'Not quite right. Try again!');
        if (step.hint) renderHint(step.hint);

        const { retry } = await inquirer.prompt([{
          type: 'confirm',
          name: 'retry',
          message: 'Try again?',
          default: true,
        }]);
        if (!retry) {
          if (step.solution) {
            console.log(chalk.yellow.bold('\n  Solution:'));
            renderCode(step.solution, 'graphql');
          }
          passed = true;
        }
      }
    } else {
      passed = true;
    }
  }
}

/**
 * Let the user write/edit a schema definition and validate it.
 */
export async function schemaPlayground(step) {
  if (step.title) renderSubtitle(step.title);
  if (step.explanation) renderExplanation(step.explanation);

  let passed = false;
  while (!passed) {
    const defaultSchema = step.defaultSchema || 'type Query {\n  \n}';
    console.log(chalk.dim('  Edit the schema below:'));

    const { schema } = await inquirer.prompt([{
      type: 'editor',
      name: 'schema',
      message: 'Write your GraphQL schema:',
      default: defaultSchema,
    }]);

    console.log(chalk.dim.bold('\n  Your schema:'));
    renderCode(schema.trim(), 'graphql');

    const validation = validateSchema(schema.trim());
    if (!validation.valid) {
      renderError(`Schema error: ${validation.error}`);
      if (step.hint) renderHint(step.hint);
    } else {
      renderSuccess('Schema is valid!');

      if (step.validate) {
        const check = step.validate(schema.trim());
        if (check.pass) {
          renderSuccess(check.message || 'Correct!');
          passed = true;
        } else {
          renderError(check.message || 'Not quite right. Try again!');
          if (step.hint) renderHint(step.hint);
        }
      } else {
        passed = true;
      }
    }

    if (!passed) {
      const { retry } = await inquirer.prompt([{
        type: 'confirm',
        name: 'retry',
        message: 'Try again?',
        default: true,
      }]);
      if (!retry) {
        if (step.solution) {
          console.log(chalk.yellow.bold('\n  Solution:'));
          renderCode(step.solution, 'graphql');
        }
        passed = true;
      }
    }
  }
}

/**
 * Multiple choice quiz question.
 */
export async function quizStep(step) {
  if (step.title) renderSubtitle(step.title);
  if (step.explanation) renderExplanation(step.explanation);
  if (step.code) renderCode(step.code, step.language || 'graphql');

  let passed = false;
  while (!passed) {
    const { answer } = await inquirer.prompt([{
      type: 'list',
      name: 'answer',
      message: step.question,
      choices: step.choices,
    }]);

    if (answer === step.answer) {
      renderSuccess(step.successMessage || 'Correct!');
      passed = true;
    } else {
      renderError(step.errorMessage || 'Not quite. Try again!');
      if (step.hint) renderHint(step.hint);

      const { retry } = await inquirer.prompt([{
        type: 'confirm',
        name: 'retry',
        message: 'Try again?',
        default: true,
      }]);
      if (!retry) {
        console.log(chalk.yellow(`  The correct answer was: ${step.answer}\n`));
        passed = true;
      }
    }
  }
}

/**
 * A combined step: edit schema + write query + see result.
 */
export async function fullPlayground(step) {
  if (step.title) renderSubtitle(step.title);
  if (step.explanation) renderExplanation(step.explanation);

  let passed = false;
  while (!passed) {
    // Step 1: Schema
    const { schema } = await inquirer.prompt([{
      type: 'editor',
      name: 'schema',
      message: 'Write your GraphQL schema:',
      default: step.defaultSchema || 'type Query {\n  hello: String\n}',
    }]);

    const schemaCheck = validateSchema(schema.trim());
    if (!schemaCheck.valid) {
      renderError(`Schema error: ${schemaCheck.error}`);
      continue;
    }
    renderSuccess('Schema is valid!');
    renderCode(schema.trim(), 'graphql');

    // Step 2: Query
    const { query } = await inquirer.prompt([{
      type: 'editor',
      name: 'query',
      message: 'Write your GraphQL query:',
      default: step.defaultQuery || '{\n  hello\n}',
    }]);

    console.log(chalk.dim.bold('\n  Your query:'));
    renderCode(query.trim(), 'graphql');

    // Step 3: Execute
    const result = await executeGraphQL({
      typeDefs: schema.trim(),
      resolvers: step.resolvers || {},
      query: query.trim(),
      variables: step.variables,
    });

    renderResult(result);

    if (step.validate) {
      const validation = step.validate(result, schema.trim(), query.trim());
      if (validation.pass) {
        renderSuccess(validation.message || 'Correct!');
        passed = true;
      } else {
        renderError(validation.message || 'Not quite right.');
        if (step.hint) renderHint(step.hint);
      }
    } else {
      passed = true;
    }

    if (!passed) {
      const { retry } = await inquirer.prompt([{
        type: 'confirm',
        name: 'retry',
        message: 'Try again?',
        default: true,
      }]);
      if (!retry) {
        if (step.solution) {
          console.log(chalk.yellow.bold('\n  Solution:'));
          renderCode(step.solution, 'graphql');
        }
        passed = true;
      }
    }
  }
}
