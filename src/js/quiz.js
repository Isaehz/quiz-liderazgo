import { questions } from './questions.js';
import { resolveProfile } from './profiles.js';

export class QuizController {
  constructor() {
    this.questions = questions;
    this.totalQuestions = questions.length;
    this.currentIndex = 0; // 0..4
    this.answers = new Array(this.totalQuestions).fill(null);
    this.view = 'intro'; // 'intro' | 'student' | 'question' | 'loading' | 'results'
    this.studentName = '';
    this.direction = 'next';
    this.subscribers = new Set();
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(listener => listener(state));
  }

  getState() {
    const currentQuestion = this.questions[this.currentIndex] || null;
    const answeredCount = this.answers.filter(a => a !== null).length;
    const isCurrentAnswered = this.answers[this.currentIndex] !== null;
    const isLastQuestion = this.currentIndex === this.totalQuestions - 1;
    const allAnswered = answeredCount === this.totalQuestions;

    let profile = null;
    if (this.view === 'results') {
      profile = resolveProfile(this.answers);
    }

    return {
      view: this.view,
      direction: this.direction,
      currentIndex: this.currentIndex,
      currentQuestion,
      totalQuestions: this.totalQuestions,
      answers: [...this.answers],
      currentAnswer: this.answers[this.currentIndex],
      answeredCount,
      isCurrentAnswered,
      isLastQuestion,
      allAnswered,
      canGoBack: this.currentIndex > 0,
      profile,
      studentName: this.studentName,
    };
  }

  start(studentName = '') {
    this.currentIndex = 0;
    this.answers = new Array(this.totalQuestions).fill(null);
    this.studentName = studentName.trim();
    this.direction = 'next';
    this.view = 'question';
    this.notify();
  }

  selectAnswer(type) {
    this.answers[this.currentIndex] = type;
    this.notify();
  }

  goToQuestion(index) {
    if (index >= 0 && index < this.totalQuestions && index !== this.currentIndex) {
      this.direction = index > this.currentIndex ? 'next' : 'prev';
      this.currentIndex = index;
      this.notify();
    }
  }

  next() {
    if (this.answers[this.currentIndex] === null) return;
    this.direction = 'next';
    if (this.currentIndex < this.totalQuestions - 1) {
      this.currentIndex++;
      this.notify();
    } else {
      this.view = 'results';
      this.notify();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.direction = 'prev';
      this.currentIndex--;
      this.notify();
    }
  }

  setView(viewName) {
    this.view = viewName;
    this.notify();
  }

  reset() {
    this.currentIndex = 0;
    this.answers = new Array(this.totalQuestions).fill(null);
    this.studentName = '';
    this.direction = 'next';
    this.view = 'intro';
    this.notify();
  }
}
