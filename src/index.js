#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import { renderTitle, renderProgress, renderDivider } from './engine/renderer.js';

const lessonModules = [
  () => import('./lessons/01-what-is-graphql.js'),
  () => import('./lessons/02-schema-and-types.js'),
  () => import('./lessons/03-queries-and-fields.js'),
  () => import('./lessons/04-fragments-and-variables.js'),
  () => import('./lessons/05-mutations.js'),
  () => import('./lessons/06-enums-interfaces-unions.js'),
  () => import('./lessons/07-directives.js'),
  () => import('./lessons/08-resolvers-deep-dive.js'),
  () => import('./lessons/09-error-handling.js'),
  () => import('./lessons/10-pagination.js'),
  () => import('./lessons/11-authentication-authorization.js'),
  () => import('./lessons/12-performance-n-plus-one.js'),
  () => import('./lessons/13-subscriptions-realtime.js'),
  () => import('./lessons/14-schema-design-best-practices.js'),
  () => import('./lessons/15-introspection-tooling.js'),
];

async function loadAllMeta() {
  const metas = [];
  for (const loader of lessonModules) {
    const mod = await loader();
    metas.push(mod.meta);
  }
  return metas;
}

function showWelcome() {
  console.clear();
  console.log(boxen(
    chalk.bold.cyan('  GraphQL Training Tool  ') + '\n\n' +
    chalk.white('  Interactive lessons from basics to advanced  ') + '\n' +
    chalk.dim('  Learn by doing — write real queries and schemas  '),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
    }
  ));
}

async function showMenu(metas) {
  const levelColors = {
    beginner: chalk.green,
    intermediate: chalk.yellow,
    advanced: chalk.red,
  };

  const choices = metas.map((meta, i) => {
    const color = levelColors[meta.level] || chalk.white;
    const levelTag = color(`[${meta.level.toUpperCase()}]`);
    const num = chalk.dim(String(i + 1).padStart(2) + '.');
    return {
      name: `${num} ${levelTag} ${meta.title} ${chalk.dim('— ' + meta.description)}`,
      value: i,
      short: meta.title,
    };
  });

  // Add section headers
  const beginnerStart = choices.findIndex((_, i) => metas[i].level === 'beginner');
  const intermediateStart = choices.findIndex((_, i) => metas[i].level === 'intermediate');
  const advancedStart = choices.findIndex((_, i) => metas[i].level === 'advanced');

  const grouped = [];
  if (beginnerStart >= 0) grouped.push(new inquirer.Separator(chalk.green.bold('\n  --- BEGINNER ---')));
  choices.filter((_, i) => metas[i].level === 'beginner').forEach(c => grouped.push(c));
  if (intermediateStart >= 0) grouped.push(new inquirer.Separator(chalk.yellow.bold('\n  --- INTERMEDIATE ---')));
  choices.filter((_, i) => metas[i].level === 'intermediate').forEach(c => grouped.push(c));
  if (advancedStart >= 0) grouped.push(new inquirer.Separator(chalk.red.bold('\n  --- ADVANCED ---')));
  choices.filter((_, i) => metas[i].level === 'advanced').forEach(c => grouped.push(c));

  grouped.push(new inquirer.Separator('\n'));
  grouped.push({ name: chalk.dim('  Exit'), value: -1, short: 'Exit' });

  const { lessonIndex } = await inquirer.prompt([{
    type: 'list',
    name: 'lessonIndex',
    message: 'Choose a lesson:',
    choices: grouped,
    pageSize: 25,
  }]);

  return lessonIndex;
}

async function runLesson(index, metas) {
  const mod = await lessonModules[index]();
  const meta = mod.meta;

  renderTitle(`Lesson ${meta.id}: ${meta.title}`);
  renderProgress(index + 1, metas.length, meta.title);

  await mod.run();

  renderDivider();
  console.log(chalk.green.bold(`  Lesson ${meta.id} complete!\n`));

  const hasNext = index < lessonModules.length - 1;
  const choices = [];
  if (hasNext) {
    choices.push({ name: `Next lesson: ${metas[index + 1].title}`, value: 'next' });
  }
  choices.push({ name: 'Back to menu', value: 'menu' });
  choices.push({ name: 'Exit', value: 'exit' });

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What next?',
    choices,
  }]);

  return action === 'next' ? index + 1 : action === 'menu' ? -2 : -1;
}

async function main() {
  showWelcome();

  const metas = await loadAllMeta();

  let running = true;
  while (running) {
    const lessonIndex = await showMenu(metas);

    if (lessonIndex === -1) {
      console.log(chalk.cyan('\n  Thanks for learning GraphQL! Happy querying!\n'));
      running = false;
      break;
    }

    let currentIndex = lessonIndex;
    while (currentIndex >= 0 && currentIndex < lessonModules.length) {
      const nextAction = await runLesson(currentIndex, metas);
      if (nextAction === -1) {
        running = false;
        console.log(chalk.cyan('\n  Thanks for learning GraphQL! Happy querying!\n'));
        break;
      } else if (nextAction === -2) {
        break; // back to menu
      } else {
        currentIndex = nextAction;
      }
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
