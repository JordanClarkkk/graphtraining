/* ===== GraphQL Trainer — Main App ===== */

let currentLesson = null;
let currentStepIndex = 0;
let completedLessons = new Set();
let editors = {};
let editorId = 0;

// Load progress from localStorage
try {
  const saved = localStorage.getItem('graphql-trainer-progress');
  if (saved) completedLessons = new Set(JSON.parse(saved));
} catch (e) {}

function saveProgress() {
  localStorage.setItem('graphql-trainer-progress', JSON.stringify([...completedLessons]));
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  updateProgress();
});

// ===== Navigation =====
function renderNav() {
  const nav = document.getElementById('lesson-nav');
  const levels = ['beginner', 'intermediate', 'advanced'];
  const levelLabels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

  let html = '';
  for (const level of levels) {
    const lessons = window.LESSONS.filter(l => l.level === level);
    html += `<div class="nav-section">
      <div class="nav-section-title ${level}">${levelLabels[level]}</div>
    </div>`;
    for (const lesson of lessons) {
      const isCompleted = completedLessons.has(lesson.id);
      const isActive = currentLesson && currentLesson.id === lesson.id;
      html += `<div class="nav-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}"
                    onclick="loadLesson(${lesson.id})" data-lesson-id="${lesson.id}">
        <div class="nav-dot"></div>
        <span class="nav-label">${lesson.id}. ${lesson.title}</span>
      </div>`;
    }
  }
  nav.innerHTML = html;
}

function updateProgress() {
  const total = window.LESSONS.length;
  const done = completedLessons.size;
  document.getElementById('global-progress').style.width = `${(done / total) * 100}%`;
  document.getElementById('progress-text').textContent = `${done} / ${total} completed`;
}

// ===== Screens =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function startFirstLesson() {
  loadLesson(1);
}

// ===== Load Lesson =====
function loadLesson(lessonId) {
  const lesson = window.LESSONS.find(l => l.id === lessonId);
  if (!lesson) return;

  currentLesson = lesson;
  currentStepIndex = 0;
  editors = {};

  // Update header
  const badge = document.getElementById('lesson-level-badge');
  badge.textContent = lesson.level.toUpperCase();
  badge.className = `level-badge ${lesson.level}`;
  document.getElementById('lesson-number').textContent = `Lesson ${lesson.id}`;
  document.getElementById('lesson-title').textContent = lesson.title;

  // Step dots
  renderStepDots();

  // Show lesson screen
  showScreen('lesson-screen');
  renderStep();
  renderNav();

  // Reset state for mutation-based lessons
  fetch('/api/reset-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId }),
  });
}

function renderStepDots() {
  const dots = document.getElementById('step-dots');
  dots.innerHTML = currentLesson.steps.map((_, i) => {
    let cls = 'step-dot';
    if (i < currentStepIndex) cls += ' completed';
    if (i === currentStepIndex) cls += ' active';
    return `<div class="${cls}" onclick="goToStep(${i})"></div>`;
  }).join('');
  document.getElementById('step-counter').textContent =
    `Step ${currentStepIndex + 1} / ${currentLesson.steps.length}`;
}

function goToStep(index) {
  if (index >= 0 && index < currentLesson.steps.length) {
    currentStepIndex = index;
    renderStepDots();
    renderStep();
  }
}

// ===== Render Step =====
function renderStep() {
  const step = currentLesson.steps[currentStepIndex];
  const body = document.getElementById('lesson-body');

  // Update nav buttons
  document.getElementById('btn-prev').disabled = currentStepIndex === 0;
  const isLast = currentStepIndex === currentLesson.steps.length - 1;
  const nextBtn = document.getElementById('btn-next');
  nextBtn.textContent = isLast ? 'Complete Lesson ✓' : 'Next →';
  nextBtn.className = isLast ? 'btn btn-success' : 'btn btn-primary';

  renderStepDots();

  let html = '<div class="step-content">';

  if (step.title) {
    html += `<h3 style="margin-bottom:16px;font-size:20px;">${step.title}</h3>`;
  }

  switch (step.type) {
    case 'explain':
      html += renderExplainStep(step);
      break;
    case 'playground':
      html += renderPlaygroundStep(step);
      break;
    case 'schema-playground':
      html += renderSchemaPlaygroundStep(step);
      break;
    case 'quiz':
      html += renderQuizStep(step);
      break;
  }

  html += '</div>';
  body.innerHTML = html;
  body.scrollTop = 0;

  // Initialize CodeMirror editors after DOM update
  requestAnimationFrame(() => initEditors());
}

// ===== Explain Step =====
function renderExplainStep(step) {
  let html = '';
  if (step.content) {
    html += `<div class="explanation">${step.content}</div>`;
  }
  if (step.code) {
    html += renderCodeBlock(step.code, step.language || 'graphql');
  }
  return html;
}

// ===== Code Block (static) =====
function renderCodeBlock(code, language) {
  const highlighted = highlightCode(code, language);
  return `<div class="code-block">
    <div class="code-block-header">
      <span>${language.toUpperCase()}</span>
    </div>
    <pre>${highlighted}</pre>
  </div>`;
}

function highlightCode(code, language) {
  let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (language === 'graphql' || language === 'gql') {
    // Comments
    escaped = escaped.replace(/(#.*$)/gm, '<span class="token-comment">$1</span>');
    // Strings
    escaped = escaped.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="token-string">$1</span>');
    // Variables
    escaped = escaped.replace(/(\$\w+)/g, '<span class="token-variable">$1</span>');
    // Directives
    escaped = escaped.replace(/(@\w+)/g, '<span class="token-directive">$1</span>');
    // Bang
    escaped = escaped.replace(/(!)/g, '<span class="token-bang">$1</span>');
    // Keywords
    escaped = escaped.replace(/\b(type|query|mutation|subscription|input|enum|interface|union|scalar|schema|extend|fragment|on|implements|directive)\b/g,
      '<span class="token-keyword">$1</span>');
    // Built-in types
    escaped = escaped.replace(/\b(String|Int|Float|Boolean|ID)\b/g, '<span class="token-type">$1</span>');
    // Enum-like values (ALL_CAPS)
    escaped = escaped.replace(/\b([A-Z][A-Z_]{2,})\b/g, '<span class="token-enum">$1</span>');
    // Numbers
    escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');
  } else if (language === 'json') {
    escaped = escaped.replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="token-field">$1</span>:');
    escaped = escaped.replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="token-string">$1</span>');
    escaped = escaped.replace(/:\s*(\d+\.?\d*)/g, ': <span class="token-number">$1</span>');
    escaped = escaped.replace(/\b(true|false|null)\b/g, '<span class="token-keyword">$1</span>');
  }

  return escaped;
}

// ===== Playground Step =====
function renderPlaygroundStep(step) {
  const eid = ++editorId;
  let html = '';
  if (step.content) {
    html += `<div class="explanation">${step.content}</div>`;
  }

  // Schema viewer
  if (step.schema) {
    html += `<div class="schema-viewer collapsed" id="schema-viewer-${eid}">
      <div class="pane-header" onclick="toggleSchemaViewer(${eid})">
        <span>📋 Schema Definition (click to expand)</span>
        <span class="toggle-icon">▶</span>
      </div>
      <pre>${highlightCode(step.schema, 'graphql')}</pre>
    </div>`;
  }

  // Variables display
  if (step.variables && Object.keys(step.variables).length > 0) {
    html += `<div class="info-box tip">
      <strong>Variables:</strong> <code>${JSON.stringify(step.variables)}</code> will be sent with your query.
    </div>`;
  }

  // Playground
  html += `<div class="playground">
    <div class="playground-pane">
      <div class="pane-header">
        <span>✏️ Query Editor</span>
        <div class="pane-actions">
          <button class="btn btn-sm btn-ghost" onclick="resetEditor(${eid}, ${JSON.stringify(step.defaultQuery).replace(/"/g, '&quot;')})">Reset</button>
          <button class="btn btn-sm btn-primary" onclick="runQuery(${eid})">▶ Run</button>
        </div>
      </div>
      <div class="pane-body">
        <textarea id="editor-${eid}" data-editor-id="${eid}">${step.defaultQuery || '{\n  \n}'}</textarea>
      </div>
    </div>
    <div class="playground-pane">
      <div class="pane-header">
        <span>📤 Result</span>
      </div>
      <div class="pane-body">
        <div class="result-output" id="result-${eid}">Click "Run" to execute your query...</div>
      </div>
    </div>
  </div>`;

  // Feedback
  html += `<div class="feedback-alert" id="feedback-${eid}"></div>`;

  // Hint & solution
  if (step.hint) {
    html += `<div class="solution-toggle" onclick="showHint(${eid})">💡 Show hint</div>
      <div class="feedback-alert hint" id="hint-${eid}" style="display:none">${step.hint}</div>`;
  }
  if (step.solution) {
    html += `<div class="solution-toggle" onclick="showSolution(${eid})">👁 Show solution</div>
      <div class="solution-content" id="solution-${eid}">
        ${renderCodeBlock(step.solution, 'graphql')}
      </div>`;
  }

  // Store step metadata for the editor
  setTimeout(() => {
    window[`_step_${eid}`] = step;
  }, 0);

  return html;
}

// ===== Schema Playground Step =====
function renderSchemaPlaygroundStep(step) {
  const eid = ++editorId;
  let html = '';
  if (step.content) {
    html += `<div class="explanation">${step.content}</div>`;
  }

  html += `<div class="playground" style="grid-template-columns:1fr;">
    <div class="playground-pane" style="border-right:none;">
      <div class="pane-header">
        <span>✏️ Schema Editor</span>
        <div class="pane-actions">
          <button class="btn btn-sm btn-ghost" onclick="resetEditor(${eid}, ${JSON.stringify(step.defaultSchema).replace(/"/g, '&quot;')})">Reset</button>
          <button class="btn btn-sm btn-primary" onclick="validateSchemaEditor(${eid})">✓ Validate</button>
        </div>
      </div>
      <div class="pane-body" style="min-height:250px;">
        <textarea id="editor-${eid}" data-editor-id="${eid}" data-type="schema">${step.defaultSchema || 'type Query {\n  \n}'}</textarea>
      </div>
    </div>
  </div>`;

  html += `<div class="feedback-alert" id="feedback-${eid}"></div>`;

  if (step.hint) {
    html += `<div class="solution-toggle" onclick="showHint(${eid})">💡 Show hint</div>
      <div class="feedback-alert hint" id="hint-${eid}" style="display:none">${step.hint}</div>`;
  }
  if (step.solution) {
    html += `<div class="solution-toggle" onclick="showSolution(${eid})">👁 Show solution</div>
      <div class="solution-content" id="solution-${eid}">
        ${renderCodeBlock(step.solution, 'graphql')}
      </div>`;
  }

  setTimeout(() => { window[`_step_${eid}`] = step; }, 0);
  return html;
}

// ===== Quiz Step =====
function renderQuizStep(step) {
  const qid = ++editorId;
  let html = '';
  if (step.content) {
    html += `<div class="explanation">${step.content}</div>`;
  }
  if (step.code) {
    html += renderCodeBlock(step.code, step.language || 'graphql');
  }

  html += `<div class="quiz-container" id="quiz-${qid}">
    <div class="quiz-question">${step.question}</div>
    <div class="quiz-options">`;

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  step.choices.forEach((choice, i) => {
    html += `<div class="quiz-option" data-choice="${choice.replace(/"/g, '&quot;')}"
                  onclick="selectQuizOption(${qid}, this, '${choice.replace(/'/g, "\\'")}')">
      <div class="option-marker">${letters[i]}</div>
      <span>${choice}</span>
    </div>`;
  });

  html += `</div>
    <div style="margin-top:16px;">
      <button class="btn btn-primary" id="quiz-submit-${qid}" onclick="submitQuiz(${qid})" disabled>Check Answer</button>
    </div>
    <div class="quiz-feedback" id="quiz-feedback-${qid}"></div>
  </div>`;

  setTimeout(() => { window[`_step_${qid}`] = step; }, 0);
  return html;
}

// ===== Editor Management =====
function initEditors() {
  document.querySelectorAll('textarea[data-editor-id]').forEach(textarea => {
    const eid = textarea.dataset.editorId;
    if (editors[eid]) return;

    const cm = CodeMirror.fromTextArea(textarea, {
      mode: 'javascript',
      theme: 'graphql',
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      tabSize: 2,
      indentWithTabs: false,
      lineWrapping: true,
      viewportMargin: Infinity,
      extraKeys: {
        'Ctrl-Enter': () => {
          if (textarea.dataset.type === 'schema') {
            validateSchemaEditor(parseInt(eid));
          } else {
            runQuery(parseInt(eid));
          }
        },
        'Cmd-Enter': () => {
          if (textarea.dataset.type === 'schema') {
            validateSchemaEditor(parseInt(eid));
          } else {
            runQuery(parseInt(eid));
          }
        },
      },
    });
    cm.setSize('100%', '100%');
    editors[eid] = cm;
  });
}

function resetEditor(eid, defaultValue) {
  if (editors[eid]) {
    editors[eid].setValue(defaultValue);
  }
}

// ===== API Calls =====
async function runQuery(eid) {
  const step = window[`_step_${eid}`];
  const cm = editors[eid];
  if (!cm || !step) return;

  const query = cm.getValue().trim();
  const resultEl = document.getElementById(`result-${eid}`);
  const feedbackEl = document.getElementById(`feedback-${eid}`);

  resultEl.textContent = 'Executing...';
  resultEl.className = 'result-output';
  feedbackEl.style.display = 'none';

  try {
    const resp = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schemaSDL: step.schema,
        query,
        variables: step.variables || {},
        lessonId: currentLesson.id,
        resolverKey: step.resolverKey,
      }),
    });

    const result = await resp.json();

    if (result.error) {
      resultEl.textContent = `Error:\n${result.error}`;
      resultEl.className = 'result-output error';
      showFeedback(eid, 'error', result.error);
      return;
    }

    // Show result
    const output = JSON.stringify(result, null, 2);
    resultEl.textContent = output;
    resultEl.className = result.errors ? 'result-output error' : 'result-output success';

    // Validate if validator exists
    if (step.validate) {
      const validation = step.validate(result, query);
      if (validation.pass) {
        showFeedback(eid, 'success', `✓ ${validation.message}`);
      } else {
        showFeedback(eid, 'error', `✗ ${validation.message}`);
      }
    }
  } catch (err) {
    resultEl.textContent = `Network error: ${err.message}`;
    resultEl.className = 'result-output error';
  }
}

async function validateSchemaEditor(eid) {
  const step = window[`_step_${eid}`];
  const cm = editors[eid];
  if (!cm || !step) return;

  const schemaSDL = cm.getValue().trim();

  try {
    const resp = await fetch('/api/validate-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaSDL }),
    });

    const result = await resp.json();

    if (!result.valid) {
      showFeedback(eid, 'error', `Schema error: ${result.error}`);
      return;
    }

    if (step.validate) {
      const validation = step.validate(schemaSDL);
      if (validation.pass) {
        showFeedback(eid, 'success', `✓ ${validation.message}`);
      } else {
        showFeedback(eid, 'error', `✗ ${validation.message}`);
      }
    } else {
      showFeedback(eid, 'success', '✓ Schema is valid!');
    }
  } catch (err) {
    showFeedback(eid, 'error', `Error: ${err.message}`);
  }
}

// ===== Quiz =====
let selectedQuizAnswer = {};

function selectQuizOption(qid, el, choice) {
  // Deselect all
  el.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(opt => {
    opt.classList.remove('selected', 'correct', 'wrong');
  });
  el.classList.add('selected');
  selectedQuizAnswer[qid] = choice;
  document.getElementById(`quiz-submit-${qid}`).disabled = false;
}

function submitQuiz(qid) {
  const step = window[`_step_${qid}`];
  const selected = selectedQuizAnswer[qid];
  const feedbackEl = document.getElementById(`quiz-feedback-${qid}`);
  const container = document.getElementById(`quiz-${qid}`);

  const options = container.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    const choiceText = opt.dataset.choice;
    if (choiceText === step.answer) {
      opt.classList.add('correct');
    } else if (choiceText === selected && selected !== step.answer) {
      opt.classList.add('wrong');
    }
    opt.style.pointerEvents = 'none';
  });

  if (selected === step.answer) {
    feedbackEl.className = 'quiz-feedback correct';
    feedbackEl.innerHTML = `✓ ${step.successMessage || 'Correct!'}`;
  } else {
    feedbackEl.className = 'quiz-feedback incorrect';
    feedbackEl.innerHTML = `✗ Not quite. The correct answer is: <strong>${step.answer}</strong>`;
    if (step.hint) {
      feedbackEl.innerHTML += `<br><em>Hint: ${step.hint}</em>`;
    }
  }

  document.getElementById(`quiz-submit-${qid}`).disabled = true;
}

// ===== Feedback & Hints =====
function showFeedback(eid, type, message) {
  const el = document.getElementById(`feedback-${eid}`);
  if (!el) return;
  el.className = `feedback-alert ${type}`;
  el.innerHTML = message;
  el.style.display = 'flex';
}

function showHint(eid) {
  const el = document.getElementById(`hint-${eid}`);
  if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

function showSolution(eid) {
  const el = document.getElementById(`solution-${eid}`);
  if (el) el.classList.toggle('visible');
}

function toggleSchemaViewer(eid) {
  const el = document.getElementById(`schema-viewer-${eid}`);
  if (el) {
    el.classList.toggle('collapsed');
    const icon = el.querySelector('.toggle-icon');
    icon.textContent = el.classList.contains('collapsed') ? '▶' : '▼';
  }
}

// ===== Step Navigation =====
function nextStep() {
  if (currentStepIndex < currentLesson.steps.length - 1) {
    currentStepIndex++;
    renderStep();
  } else {
    // Lesson complete
    completedLessons.add(currentLesson.id);
    saveProgress();
    updateProgress();
    renderNav();

    // Go to next lesson or back to welcome
    const nextLesson = window.LESSONS.find(l => l.id === currentLesson.id + 1);
    if (nextLesson) {
      loadLesson(nextLesson.id);
    } else {
      showScreen('welcome-screen');
    }
  }
}

function prevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    renderStep();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Don't capture when typing in editor
  if (e.target.closest('.CodeMirror')) return;

  if (e.key === 'ArrowRight' && e.altKey) {
    nextStep();
  } else if (e.key === 'ArrowLeft' && e.altKey) {
    prevStep();
  }
});
