const practice = document.documentElement.dataset.mode === 'practice';
const exams = practice ? window.perioPractice : window.perioExams;
const byId = id => document.getElementById(id);
const home = byId('home');
const attempt = byId('attempt');
const questionPanel = byId('question');
const palette = byId('palette');
const dialog = byId('confirm');
const caseNotes = byId('case-notes');
let year;
let state;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(label, action, className) {
  const node = element('button', label, className);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function storageKey(id) {
  return `dod-perio-${practice ? 'practice-' : ''}${id}-v1`;
}

function load(selectedYear) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(selectedYear)));
  } catch {
    return null;
  }
}

function save() {
  try {
    localStorage.setItem(storageKey(year), JSON.stringify(state));
  } catch {
    byId('progress').title = 'Browser storage is unavailable. Progress is available in this tab.';
  }
}

function showHome() {
  home.hidden = false;
  attempt.hidden = true;
  const list = byId('years');
  list.replaceChildren();
  for (const [selectedYear, exam] of Object.entries(exams).sort(([a], [b]) => practice ? a.localeCompare(b) : Number(b) - Number(a))) {
    const previous = load(selectedYear);
    const card = element('article', null, 'year');
    card.append(element('h2', exam.title || selectedYear), element('p', `${exam.questions.length} ${practice ? 'questions' : 'recovered questions'}`, 'subtle'),
      element('p', exam.note, 'note'));
    const actions = element('div', null, 'controls');
    actions.append(button(previous ? (previous.finished ? 'Review attempt' : 'Resume exam') : 'Start exam',
      () => openExam(selectedYear, previous), 'primary'));
    if (previous) actions.append(button('Start over', () => {
      if (window.confirm(`Replace the saved attempt for ${exam.title || selectedYear}?`)) openExam(selectedYear);
    }));
    card.append(actions);
    list.append(card);
  }
}

function openExam(selectedYear, previous) {
  year = selectedYear;
  state = previous || { index: 0, answers: {}, flags: {}, started: Date.now(), finished: null };
  home.hidden = true;
  attempt.hidden = false;
  const exam = exams[year];
  if (caseNotes) {
    byId('notes-panel').hidden = !exam.figures;
    byId('notes-panel').open = true;
    caseNotes.value = state.notes || '';
  }
  byId('exam-title').textContent = exam.title || `${year} Perio Exam`;
  byId('source').href = exam.source || (exam.pdf ? `../${encodeURIComponent(exam.pdf)}` : '#');
  save();
  render();
}

function answeredCount() {
  return Object.values(state.answers).filter(answer => answer.trim()).length;
}

function updateMetrics() {
  if (attempt.hidden) return;
  const seconds = Math.max(0, Math.floor(((state.finished || Date.now()) - state.started) / 1000));
  byId('timer').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} elapsed`;
  byId('progress').textContent = `${answeredCount()} / ${exams[year].questions.length} answered`;
}

function isIncorrect(q) {
  const answer = state.answers[q.id];
  return Boolean(state.finished && q.key && !q.missingImage &&
    Object.keys(q.choices).length > 1 && answer && !q.key.includes(answer));
}

function updatePalette() {
  for (const [index, node] of Array.from(palette.children).entries()) {
    const id = node.dataset.id;
    const incorrect = isIncorrect(exams[year].questions[index]);
    node.classList.toggle('incorrect', incorrect);
    const isAnswered = Boolean(state.answers[id]?.trim());
    node.classList.toggle('answered', isAnswered);
    node.classList.toggle('flagged', Boolean(state.flags[id]));
    const prefix = id.includes('.') ? 'Case item' : 'Question';
    node.setAttribute('aria-label', `${prefix} ${id}${incorrect ? ', incorrect' : isAnswered ? ', answered' : ''}${state.flags[id] ? ', flagged' : ''}`);
  }
}

function go(index) {
  state.index = index;
  save();
  render();
  questionPanel.querySelector('h2').focus();
}

function addImage(path, caption) {
  const figure = element('figure');
  const img = element('img');
  img.src = path;
  img.alt = 'Clinical photograph included in the 2025 recall';
  figure.append(img, element('figcaption', caption));
  questionPanel.append(figure);
}

function render() {
  const exam = exams[year];
  const q = exam.questions[state.index];
  const options = Object.entries(q.choices);
  const grading = exam.questions.filter(item => item.key && Object.keys(item.choices).length > 1 && !item.missingImage);
  const gradable = grading.includes(q);
  const incorrect = isIncorrect(q);
  const result = byId('result');
  result.hidden = !state.finished;
  byId('submit').hidden = Boolean(state.finished);
  byId('source').hidden = !state.finished || !(exam.pdf || exam.source);
  const credit = byId('credit');
  if (credit) {
    credit.hidden = !state.finished || !exam.citation;
    credit.textContent = exam.citation
      ? `${exam.authors.join(', ')}. ${exam.citation}. Image license: ${exam.license}. Figures: ${exam.figures.map(figure => figure.number).join(', ')}.`
      : '';
  }
  if (state.finished) {
    const correct = grading.filter(item => item.key.includes(state.answers[item.id])).length;
    result.textContent = `${correct} / ${grading.length} on automatically scored questions. ${practice ? 'Review each answer and its rationale below.' : 'This is a practice score. Review the other responses against the available recall notes.'}`;
  }

  questionPanel.replaceChildren();
  const heading = element('h2', `${q.id.includes('.') ? 'Case item' : 'Question'} ${q.id}`);
  heading.tabIndex = -1;
  questionPanel.append(heading);
  if (q.case) {
    const details = element('details', null, 'case');
    details.open = true;
    details.append(element('summary', practice ? 'Patient information and exhibits' : `Case ${q.case} · Patient information`), element('p', exam.cases[q.case]));
    if (exam.figures) {
      const exhibits = element('div', null, 'exhibits');
      for (const {path, caption} of exam.figures) {
        const figure = element('figure');
        const link = element('a');
        link.href = path;
        link.target = '_blank';
        link.rel = 'noopener';
        const img = element('img');
        img.src = path;
        img.alt = caption;
        link.append(img);
        figure.append(link, element('figcaption', caption));
        exhibits.append(figure);
      }
      details.append(exhibits);
    }
    questionPanel.append(details);
  }
  const stem = element('p', q.stem);
  stem.id = 'current-stem';
  questionPanel.append(stem);
  if (q.image) addImage(q.image, 'Illustration from the recall PDF');
  if (q.missingImage) questionPanel.append(element('p', 'The original image is missing from the recall.', 'note'));
  if (q.edited) questionPanel.append(element('p', 'Prompt reconstructed from the recall.', 'note'));
  if (q.rebuiltChoices) questionPanel.append(element('p', 'Some answer choices were reconstructed for practice.', 'note'));

  if (options.length > 1) {
    const choices = element('fieldset');
    choices.setAttribute('aria-labelledby', stem.id);
    for (const [id, value] of options) {
      const label = element('label', null, 'option');
      const radio = element('input');
      radio.type = 'radio';
      radio.name = 'answer';
      radio.value = id;
      radio.disabled = Boolean(state.finished);
      radio.checked = state.answers[q.id] === id;
      if (incorrect && radio.checked) {
        label.classList.add('incorrect');
      }
      radio.addEventListener('change', () => record(q.id, id));
      label.append(radio, element('span', `${id.toUpperCase()}. ${value}`));
      if (incorrect && radio.checked) label.append(element('span', 'Incorrect', 'answer-status'));
      choices.append(label);
    }
    questionPanel.append(choices);
  } else {
    const label = element('label', 'Write your answer');
    label.htmlFor = 'response';
    const response = element('textarea');
    response.id = 'response';
    response.value = state.answers[q.id] || '';
    response.readOnly = Boolean(state.finished);
    response.addEventListener('input', () => record(q.id, response.value));
    questionPanel.append(element('p', 'The complete choice set was not preserved.', 'note'), label, response);
  }

  if (state.finished) {
    const review = element('div', null, incorrect ? 'review incorrect' : 'review');
    if (q.key) {
      const title = gradable ? (q.key.includes(state.answers[q.id]) ? 'Correct' : (incorrect ? 'Incorrect' : 'Unanswered')) : 'Compare your response';
      review.append(element('h2', title), element('p', `Practice key: ${q.key.map(id => q.choices[id]).join(' / ')}`));
    }
    if (q.reference) review.append(element('p', q.reference));
    if (!q.key && !q.reference) {
      review.append(element('p', options.length === 1
        ? `The recall lists: ${options[0][1]}. Credit for this response is unverified.`
        : 'The available recall does not establish a reliable key for this item.'));
    }
    questionPanel.append(review);
    if (q.reviewImage) addImage(q.reviewImage, 'Annotated illustration from the recall PDF');
  }

  const controls = element('div', null, 'controls');
  const previous = button('← Previous', () => go(state.index - 1));
  const next = button('Next →', () => go(state.index + 1));
  previous.disabled = state.index === 0;
  next.disabled = state.index === exam.questions.length - 1;
  controls.append(previous);
  if (!state.finished) {
    const flag = button('Flag for review', () => {
      state.flags[q.id] = !state.flags[q.id];
      flag.setAttribute('aria-pressed', String(state.flags[q.id]));
      flag.textContent = state.flags[q.id] ? 'Remove flag' : 'Flag for review';
      save();
      updatePalette();
    });
    flag.setAttribute('aria-pressed', String(Boolean(state.flags[q.id])));
    if (state.flags[q.id]) flag.textContent = 'Remove flag';
    controls.append(flag);
    if (options.length > 1) controls.append(button('Clear answer', () => {
      record(q.id, '');
      for (const radio of questionPanel.querySelectorAll('input')) radio.checked = false;
    }));
  }
  controls.append(next);
  questionPanel.append(controls);

  palette.replaceChildren();
  exam.questions.forEach((item, index) => {
    const jump = button(item.id, () => go(index));
    jump.dataset.id = item.id;
    if (index === state.index) jump.setAttribute('aria-current', 'step');
    palette.append(jump);
  });
  updatePalette();
  updateMetrics();
}

function record(id, value) {
  state.answers[id] = value;
  save();
  updatePalette();
  updateMetrics();
}

caseNotes?.addEventListener('input', () => {
  state.notes = caseNotes.value;
  save();
});

byId('back').addEventListener('click', showHome);
byId('submit').addEventListener('click', () => {
  const outstanding = exams[year].questions.length - answeredCount();
  byId('confirm-status').textContent = outstanding
    ? `${outstanding} unanswered. You can review the practice key after submission.`
    : 'All questions are answered. The practice key will appear after submission.';
  dialog.returnValue = '';
  dialog.showModal();
});
dialog.addEventListener('close', () => {
  if (dialog.returnValue !== 'submit') return;
  state.finished = Date.now();
  state.index = 0;
  save();
  render();
  resultFocus();
});

function resultFocus() {
  const result = byId('result');
  result.tabIndex = -1;
  result.focus();
}

showHome();
setInterval(updateMetrics, 1000);
