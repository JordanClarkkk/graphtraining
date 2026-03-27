import chalk from 'chalk';
import boxen from 'boxen';

export function renderTitle(text) {
  console.log('\n' + boxen(chalk.bold.cyan(text), {
    padding: 1,
    margin: { top: 1, bottom: 1 },
    borderStyle: 'round',
    borderColor: 'cyan',
  }));
}

export function renderSubtitle(text) {
  console.log(chalk.bold.yellow(`\n  ${text}\n`));
}

export function renderExplanation(lines) {
  const text = Array.isArray(lines) ? lines.join('\n') : lines;
  text.split('\n').forEach(line => {
    console.log(chalk.white(`  ${line}`));
  });
  console.log();
}

export function renderCode(code, language = 'graphql') {
  const label = chalk.dim(`  ── ${language} ──`);
  console.log(label);
  code.split('\n').forEach((line, i) => {
    const num = chalk.dim(String(i + 1).padStart(3) + ' │ ');
    // Highlight GraphQL keywords
    let highlighted = line;
    if (language === 'graphql') {
      highlighted = highlighted
        .replace(/\b(type|query|mutation|subscription|input|enum|interface|union|scalar|schema|extend|fragment|on|implements)\b/g, chalk.magenta('$1'))
        .replace(/\b(String|Int|Float|Boolean|ID)\b/g, chalk.green('$1'))
        .replace(/(#.*$)/g, chalk.dim('$1'))
        .replace(/(!)/g, chalk.red('$1'));
    } else if (language === 'json') {
      highlighted = highlighted
        .replace(/"([^"]+)":/g, chalk.cyan('"$1"') + ':')
        .replace(/: "([^"]+)"/g, ': ' + chalk.yellow('"$1"'))
        .replace(/: (\d+)/g, ': ' + chalk.yellow('$1'))
        .replace(/: (true|false|null)/g, ': ' + chalk.magenta('$1'));
    }
    console.log(`  ${num}${highlighted}`);
  });
  console.log(chalk.dim('  ────────────'));
  console.log();
}

export function renderResult(result) {
  if (result.error) {
    console.log(boxen(chalk.red.bold('  Error\n\n') + chalk.red(`  ${result.error}`), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'red',
    }));
    return;
  }

  if (result.errors) {
    console.log(boxen(
      chalk.red.bold('  GraphQL Errors\n\n') +
      result.errors.map(e => chalk.red(`  • ${e.message}`)).join('\n'),
      { padding: 1, borderStyle: 'round', borderColor: 'red' }
    ));
    if (result.data) {
      console.log(chalk.dim('\n  Partial data returned:'));
      renderJson(result.data);
    }
    return;
  }

  console.log(boxen(
    chalk.green.bold('  Result\n\n') +
    formatJson(result.data).split('\n').map(l => `  ${l}`).join('\n'),
    { padding: 1, borderStyle: 'round', borderColor: 'green' }
  ));
}

export function renderSuccess(msg) {
  console.log(chalk.green(`  ✓ ${msg}\n`));
}

export function renderError(msg) {
  console.log(chalk.red(`  ✗ ${msg}\n`));
}

export function renderHint(msg) {
  console.log(chalk.dim.italic(`  💡 Hint: ${msg}\n`));
}

export function renderDivider() {
  console.log(chalk.dim('\n  ' + '─'.repeat(50) + '\n'));
}

export function renderJson(data) {
  renderCode(formatJson(data), 'json');
}

function formatJson(data) {
  return JSON.stringify(data, null, 2);
}

export function renderProgress(current, total, lessonTitle) {
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;
  const bar = chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
  console.log(chalk.dim(`  Progress: [${bar}] ${current}/${total} — ${lessonTitle}\n`));
}
