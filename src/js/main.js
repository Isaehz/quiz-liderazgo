import { QuizController } from './quiz.js';
import { profiles } from './profiles.js';
import { mountAvatar } from './avatar-engine.js';
import { toPng } from 'html-to-image';

import cubeeData from '../avatars/cubee.json';
import novaData from '../avatars/nova.json';
import suneeData from '../avatars/sunee.json';
import freddyData from '../avatars/freddy.json';
import kirbyData from '../avatars/kirby.json';

const avatarDataMap = {
  'cubee.json': cubeeData,
  'nova.json': novaData,
  'sunee.json': suneeData,
  'freddy.json': freddyData,
  'kirby.json': kirbyData,
};

// Global App State
const quiz = new QuizController();
let resultAvatarInstance = null;
const otherAvatarInstances = new Map();
let lastQuestionIndex = -1;
let isAnimatingTransition = false;
let displayedView = null;

// DOM Elements
const viewIntro = document.getElementById('view-intro');
const viewStudent = document.getElementById('view-student');
const viewQuiz = document.getElementById('view-quiz');
const viewLoading = document.getElementById('view-loading');
const viewResults = document.getElementById('view-results');

const btnStartQuiz = document.getElementById('btn-start-quiz');
const studentNameForm = document.getElementById('student-name-form');
const studentNameInput = document.getElementById('student-name-input');
const btnQuizPrev = document.getElementById('btn-quiz-prev');
const btnQuizNext = document.getElementById('btn-quiz-next');
const btnNextText = document.getElementById('btn-next-text');
const btnRestartQuiz = document.getElementById('btn-restart-quiz');
const btnExportResult = document.getElementById('btn-export-result');
const exportBtnText = document.getElementById('export-btn-text');

const quizProgressCounter = document.getElementById('quiz-progress-counter');
const quizProgressFill = document.getElementById('quiz-progress-fill');

const questionSlide = document.getElementById('question-slide');
const questionTag = document.getElementById('question-tag');
const questionTitle = document.getElementById('question-title');
const optionsContainer = document.getElementById('options-container');

// Results DOM Elements
const resultProfileName = document.getElementById('result-profile-name');
const resultStudentName = document.getElementById('result-student-name');
const resultProfileTagline = document.getElementById('result-profile-tagline');
const resultAvatarHost = document.getElementById('result-avatar-host');
const resultAvatarStage = document.querySelector('.avatar-free-stage');
const resultAnswerList = document.getElementById('result-answer-list');
const resultAnswerSummary = document.querySelector('.result-answer-summary-top');
const resultAvatarName = document.getElementById('result-avatar-name');
const resultAvatarPillar = document.getElementById('result-avatar-pillar');
const resultAvatarDescription = document.getElementById('result-avatar-description');
const resultSummaryText = document.getElementById('result-summary-text');
const resultBullets = document.getElementById('result-bullets');
const resultChallengeText = document.getElementById('result-challenge-text');
const resultBooksList = document.getElementById('result-books-list');
const otherAvatarsGrid = document.getElementById('other-avatars-grid');

// Switch View
function showView(viewName) {
  if (displayedView === viewName) return;

  [viewIntro, viewStudent, viewQuiz, viewLoading, viewResults].forEach(v => {
    if (v) v.classList.remove('active');
  });

  document.body.classList.toggle('results-scrollable', viewName === 'results');

  let nextView = null;
  if (viewName === 'intro') {
    nextView = viewIntro;
  } else if (viewName === 'student') {
    nextView = viewStudent;
  } else if (viewName === 'question') {
    nextView = viewQuiz;
  } else if (viewName === 'loading') {
    nextView = viewLoading;
  } else if (viewName === 'results') {
    nextView = viewResults;
  }

  if (nextView) {
    nextView.classList.add('active');
    if (viewName === 'student' || viewName === 'question') {
      nextView.classList.remove('view-enter');
      void nextView.offsetWidth;
      nextView.classList.add('view-enter');
    }
  }
  displayedView = viewName;
  window.scrollTo({ top: 0, behavior: viewName === 'results' ? 'auto' : 'smooth' });
}

// Render Option Cards into optionsContainer
function renderOptions(currentQuestion, currentAnswer) {
  optionsContainer.innerHTML = '<div class="option-selection-indicator" aria-hidden="true"></div>';
  const badges = ['A', 'B', 'C', 'D'];

  currentQuestion.options.forEach((opt, idx) => {
    const isSelected = currentAnswer === opt.type;
    const item = document.createElement('div');
    item.className = `option-item ${isSelected ? 'is-selected' : ''}`;
    item.dataset.optionType = opt.type;
    item.setAttribute('role', 'radio');
    item.setAttribute('aria-checked', String(isSelected));
    item.tabIndex = 0;

    item.innerHTML = `
      <div class="option-badge">${badges[idx] || (idx + 1)}</div>
      <span class="option-text-label">${opt.text}</span>
    `;

    const handleSelect = () => {
      quiz.selectAnswer(opt.type);
    };

    item.addEventListener('click', handleSelect);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      }
    });

    optionsContainer.appendChild(item);
  });

  requestAnimationFrame(() => updateOptionSelection(currentAnswer, true));
}

function updateOptionSelection(answerType, immediate = false) {
  const indicator = optionsContainer.querySelector('.option-selection-indicator');
  const items = [...optionsContainer.querySelectorAll('.option-item')];
  if (!indicator || !items.length) return;

  const selectedItem = items.find(item => item.dataset.optionType === answerType);
  items.forEach(item => {
    const isSelected = item === selectedItem;
    item.classList.toggle('is-selected', isSelected);
    item.setAttribute('aria-checked', String(isSelected));
  });

  if (!selectedItem) {
    indicator.style.opacity = '0';
    indicator.dataset.selectedType = '';
    return;
  }

  const containerRect = optionsContainer.getBoundingClientRect();
  const targetRect = selectedItem.getBoundingClientRect();
  const targetTop = targetRect.top - containerRect.top;
  const targetHeight = targetRect.height;
  const hadSelection = Boolean(indicator.dataset.selectedType);
  const currentRect = indicator.getBoundingClientRect();
  const startTop = hadSelection ? currentRect.top - containerRect.top : targetTop;

  indicator.getAnimations().forEach(animation => animation.cancel());
  indicator.style.top = `${targetTop}px`;
  indicator.style.height = `${targetHeight}px`;
  indicator.style.opacity = '1';
  indicator.dataset.selectedType = answerType;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  if (!immediate && hadSelection && Math.abs(startTop - targetTop) > 1) {
    const overshoot = startTop < targetTop ? 7 : -7;
    indicator.animate([
      { transform: `translateY(${startTop - targetTop}px)` },
      { transform: `translateY(${overshoot}px)`, offset: 0.86 },
      { transform: 'translateY(0)' },
    ], {
      duration: 380,
      easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
    });
  } else if (!immediate && !hadSelection) {
    indicator.animate([
      { opacity: 0.35 },
      { opacity: 1 },
    ], { duration: 180, easing: 'ease-out' });
  }
}

// Update Question Slide DOM Content
function applyQuestionContent(state) {
  const { currentQuestion, currentIndex, totalQuestions, currentAnswer, isCurrentAnswered, isLastQuestion } = state;
  if (!currentQuestion) return;

  // Progress Bar
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;
  quizProgressCounter.textContent = `Pregunta ${currentIndex + 1} de ${totalQuestions}`;
  quizProgressFill.style.width = `${progressPct}%`;

  // Buttons
  btnQuizPrev.disabled = currentIndex === 0;
  btnQuizPrev.style.opacity = currentIndex === 0 ? '0.4' : '1';
  btnQuizPrev.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';

  btnQuizNext.disabled = !isCurrentAnswered;
  btnNextText.textContent = isLastQuestion ? 'Ver Mi Resultado' : 'Siguiente';

  // Content
  questionTag.textContent = currentQuestion.tag;
  questionTitle.textContent = currentQuestion.title;

  const isNewQuestion = optionsContainer.dataset.questionIndex !== String(currentIndex);
  if (isNewQuestion) {
    optionsContainer.dataset.questionIndex = String(currentIndex);
    renderOptions(currentQuestion, currentAnswer);
  } else {
    updateOptionSelection(currentAnswer);
  }
}

// Render Question View with Carousel Slide Animation
function renderQuestionView(state) {
  const { currentIndex, direction } = state;

  if (currentIndex === lastQuestionIndex) {
    applyQuestionContent(state);
    return;
  }

  const isNavigating = lastQuestionIndex !== -1;
  lastQuestionIndex = currentIndex;

  if (!isNavigating) {
    applyQuestionContent(state);
    return;
  }

  if (isAnimatingTransition) {
    applyQuestionContent(state);
    return;
  }

  isAnimatingTransition = true;
  const isForward = direction === 'next';
  const outClass = isForward ? 'slide-next-out' : 'slide-prev-out';
  const inClass = isForward ? 'slide-next-in' : 'slide-prev-in';

  questionSlide.className = `question-slide ${outClass}`;

  setTimeout(() => {
    applyQuestionContent(state);
    questionSlide.className = `question-slide ${inClass}`;

    const handleAnimEnd = () => {
      questionSlide.className = 'question-slide';
      questionSlide.removeEventListener('animationend', handleAnimEnd);
      isAnimatingTransition = false;
    };
    questionSlide.addEventListener('animationend', handleAnimEnd);
  }, 140);
}

// Fullscreen Loading Flow before Results (Simple spinner during 1.2s)
function triggerLoadingTransition(callback) {
  showView('loading');

  setTimeout(() => {
    callback();
  }, 1200);
}

// Render Results View
function renderResultsView(state) {
  const { profile, studentName } = state;
  if (!profile) return;

  resultProfileName.textContent = profile.name;
  resultStudentName.textContent = `Resultado de ${studentName}`;
  resultProfileTagline.textContent = profile.tagline;
  const answerMarkup = state.answers.map((answer, index) => `
    <span class="result-answer-item" title="Pregunta ${index + 1}: respuesta ${answer}">
      <span class="result-answer-question">P${index + 1}</span>
      <span class="result-answer-value">${answer}</span>
    </span>
  `).join('');
  resultAnswerList.innerHTML = answerMarkup;
  resultAvatarName.textContent = profile.avatarName;
  resultAvatarPillar.textContent = profile.pillar;
  resultAvatarDescription.textContent = profile.shortDesc;

  resultSummaryText.textContent = profile.summary;
  resultBullets.innerHTML = profile.details.map(d => `<li>${d}</li>`).join('');
  resultChallengeText.textContent = profile.challenge;

  // Render Detailed Recommended Books List
  if (resultBooksList) {
    const books = profile.books || [profile.book];
    resultBooksList.innerHTML = books.map(b => `
      <div class="book-item">
        <h4 class="book-name">${b.title}</h4>
        <span class="book-writer">${b.author}</span>
        <p class="book-quote-text">"${b.quote}"</p>
      </div>
    `).join('');
  }

  // Render Free Floating Result Avatar with RANDOM Animation
  if (resultAvatarInstance) {
    resultAvatarInstance.destroy();
    resultAvatarInstance = null;
  }

  const anims = profile.interactiveAnimations && profile.interactiveAnimations.length > 0
    ? profile.interactiveAnimations
    : ['happy', 'excited', 'proud'];

  const randomAnim = anims[Math.floor(Math.random() * anims.length)];
  const avatarData = avatarDataMap[profile.avatarFile] || novaData;

  try {
    resultAvatarInstance = mountAvatar(resultAvatarHost, {
      data: avatarData,
      animation: randomAnim,
      size: '100%',
      loop: true,
    });
  } catch (err) {
    console.error('Error mounting result avatar:', err);
  }

  const interactionAnimations = [...new Set(['celebrate', ...anims])]
    .filter(animationName => avatarData.animations[animationName]);
  let animationIndex = interactionAnimations.indexOf(randomAnim);
  const playNextAvatarAnimation = () => {
    if (!resultAvatarInstance) return;
    animationIndex = (animationIndex + 1) % interactionAnimations.length;
    const nextAnim = interactionAnimations[animationIndex];
    resultAvatarInstance.stop();
    resultAvatarInstance.play(nextAnim);
    resultAvatarHost.classList.remove('is-playing');
    void resultAvatarHost.offsetWidth;
    resultAvatarHost.classList.add('is-playing');
    resultAvatarStage?.classList.remove('is-reacting');
    void resultAvatarStage?.offsetWidth;
    resultAvatarStage?.classList.add('is-reacting');
  };

  // El clic siempre reinicia una animación distinta y visible.
  resultAvatarHost.setAttribute('role', 'button');
  resultAvatarHost.tabIndex = 0;
  resultAvatarHost.setAttribute('aria-label', `Avatar de ${profile.name}. Haz clic para cambiar su animación.`);
  resultAvatarHost.onclick = playNextAvatarAnimation;
  resultAvatarHost.onkeydown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      playNextAvatarAnimation();
    }
  };

  // Render The Other 4 Avatars
  renderOtherAvatars(profile.id);

  viewResults.classList.remove('results-ready');
  requestAnimationFrame(() => viewResults.classList.add('results-ready'));
}

// Render Other 4 Avatars
function renderOtherAvatars(currentProfileId) {
  otherAvatarInstances.forEach(inst => inst.destroy());
  otherAvatarInstances.clear();
  otherAvatarsGrid.innerHTML = '';

  const allProfiles = Object.values(profiles);
  const others = allProfiles.filter(p => p.id !== currentProfileId);

  others.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'other-profile-item';

    const hostId = `other-mount-${p.id}`;
    card.innerHTML = `
      <div id="${hostId}" class="other-mount-box"></div>
      <strong class="other-archetype-name">${p.name}</strong>
      <span class="other-archetype-char" style="background: ${p.accentColor}22; color: ${p.accentColor};">
        ${p.avatarName}
      </span>
      <span class="other-archetype-pillar">${p.pillar}</span>
      <p class="other-archetype-desc">${p.shortDesc}</p>
    `;

    otherAvatarsGrid.appendChild(card);

    setTimeout(() => {
      const host = document.getElementById(hostId);
      if (host) {
        const data = avatarDataMap[p.avatarFile];
        try {
          const inst = mountAvatar(host, {
            data,
            animation: p.defaultAnimation,
            size: '100%',
            loop: true,
          });
          otherAvatarInstances.set(p.id, inst);
        } catch (err) {
          console.error(err);
        }
      }
    }, idx * 60);
  });
}

// Comparte o descarga una imagen con el nombre y el diagnóstico completos.
async function exportResultImage() {
  const target = document.getElementById('results-export-frame');
  if (!target) return;

  const originalText = exportBtnText ? exportBtnText.textContent : 'Compartir';
  if (exportBtnText) exportBtnText.textContent = 'Generando...';

  try {
    const exportPadding = 40;
    const captureWidth = Math.ceil(target.scrollWidth) + exportPadding * 2;
    const captureHeight = Math.ceil(target.scrollHeight) + exportPadding * 2;
    const dataUrl = await toPng(target, {
      backgroundColor: '#131b26',
      pixelRatio: 2,
      cacheBust: true,
      filter: node => !node.closest?.('[data-export-exclude]'),
      width: captureWidth,
      height: captureHeight,
      style: {
        width: `${captureWidth}px`,
        height: `${captureHeight}px`,
        boxSizing: 'border-box',
        padding: `${exportPadding}px`,
        borderRadius: '18px',
        border: '1px solid #243346',
      },
    });
    const leaderName = resultProfileName.textContent.trim();
    const filename = `diagnostico-${leaderName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'liderazgo'}.png`;

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([], filename, { type: 'image/png' })] })) {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.share({
        title: leaderName,
        text: `${resultStudentName.textContent}: ${leaderName}`,
        files: [new File([blob], filename, { type: 'image/png' })],
      });
      if (exportBtnText) exportBtnText.textContent = '¡Listo!';
    } else {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      if (exportBtnText) exportBtnText.textContent = '¡Listo!';
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      if (exportBtnText) exportBtnText.textContent = originalText;
      return;
    }
    console.error('Error exporting image:', err);
    if (exportBtnText) exportBtnText.textContent = 'Error al compartir';
  } finally {}

  if (exportBtnText) {
    setTimeout(() => {
      exportBtnText.textContent = originalText;
    }, 2200);
  }
}

// App Initialization
function initApp() {
  quiz.subscribe(state => {
    if (state.view === 'intro') {
      lastQuestionIndex = -1;
      showView('intro');
    } else if (state.view === 'student') {
      showView('student');
      requestAnimationFrame(() => studentNameInput?.focus());
    } else if (state.view === 'question') {
      showView('question');
      renderQuestionView(state);
    } else if (state.view === 'results') {
      showView('results');
      renderResultsView(state);
    }
  });

  btnStartQuiz.addEventListener('click', () => {
    quiz.setView('student');
  });

  studentNameForm?.addEventListener('submit', event => {
    event.preventDefault();
    const studentName = studentNameInput.value.trim();
    if (!studentName) {
      studentNameInput.focus();
      return;
    }
    quiz.start(studentName);
  });

  btnQuizPrev.addEventListener('click', () => {
    if (!isAnimatingTransition) {
      quiz.prev();
    }
  });

  btnQuizNext.addEventListener('click', () => {
    if (isAnimatingTransition) return;

    const state = quiz.getState();
    if (state.isLastQuestion) {
      triggerLoadingTransition(() => {
        quiz.next();
      });
    } else {
      quiz.next();
    }
  });

  if (btnRestartQuiz) {
    btnRestartQuiz.addEventListener('click', () => {
      quiz.reset();
    });
  }

  if (btnExportResult) {
    btnExportResult.addEventListener('click', () => {
      exportResultImage();
    });
  }

  showView('intro');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
