import { questions } from './src/js/questions.js';
import { profiles, resolveProfile } from './src/js/profiles.js';
import { QuizController } from './src/js/quiz.js';

import cubee from './src/avatars/cubee.json' with { type: 'json' };
import nova from './src/avatars/nova.json' with { type: 'json' };
import sunee from './src/avatars/sunee.json' with { type: 'json' };
import freddy from './src/avatars/freddy.json' with { type: 'json' };
import kirby from './src/avatars/kirby.json' with { type: 'json' };

console.log('--- 1. Testing Question Data ---');
if (questions.length !== 5) throw new Error(`Expected 5 questions, got ${questions.length}`);
questions.forEach((q, i) => {
  if (!q.title) throw new Error(`Question ${i + 1} has no title`);
  if (q.options.length !== 3) throw new Error(`Question ${i + 1} does not have 3 options`);
});
console.log('✓ All 5 questions have valid titles and options A, B, C.');

console.log('\n--- 2. Testing Avatars Data ---');
const avatars = { cubee, nova, sunee, freddy, kirby };
for (const [name, data] of Object.entries(avatars)) {
  if (!data.avatar || !data.avatar.name) throw new Error(`Avatar ${name} missing avatar.name`);
  if (!data.avatar.surface) throw new Error(`Avatar ${name} missing surface`);
  if (!data.expressions || Object.keys(data.expressions).length === 0) throw new Error(`Avatar ${name} has no expressions`);
  if (!data.animations || Object.keys(data.animations).length === 0) throw new Error(`Avatar ${name} has no animations`);
  console.log(`✓ Avatar ${data.avatar.name}: ${Object.keys(data.expressions).length} expressions, ${Object.keys(data.animations).length} animations.`);
}

console.log('\n--- 3. Testing Profile Resolution ---');
const testCases = [
  { answers: ['A', 'A', 'A', 'B', 'C'], expected: 'estrategico' },
  { answers: ['B', 'B', 'B', 'A', 'C'], expected: 'transformacional' },
  { answers: ['C', 'C', 'C', 'A', 'B'], expected: 'servicial' },
  { answers: ['A', 'A', 'B', 'B', 'C'], expected: 'visionario_estrategico' },
  { answers: ['B', 'B', 'C', 'C', 'A'], expected: 'mentor_humano' },
  { answers: ['A', 'A', 'C', 'C', 'B'], expected: 'mentor_humano' },
];

for (const { answers, expected } of testCases) {
  const result = resolveProfile(answers);
  if (result.id !== expected) {
    throw new Error(`Expected ${expected} for answers ${answers.join('')}, got ${result.id}`);
  }
  console.log(`✓ Answers [${answers.join(', ')}] -> ${result.name} (${result.avatarName})`);
}

console.log('\n--- 4. Testing QuizController State Machine ---');
const quiz = new QuizController();
if (quiz.getState().view !== 'intro') throw new Error('Initial view should be intro');
quiz.start();
if (quiz.getState().view !== 'question') throw new Error('View should be question after start()');

quiz.selectAnswer('A');
quiz.next();
if (quiz.getState().currentIndex !== 1) throw new Error('Index should be 1');

quiz.selectAnswer('B');
quiz.next();
quiz.selectAnswer('A');
quiz.next();
quiz.selectAnswer('B');
quiz.next();
quiz.selectAnswer('C');
quiz.next();

const finalState = quiz.getState();
if (finalState.view !== 'results') throw new Error('View should be results after question 5');
if (finalState.profile.id !== 'visionario_estrategico') throw new Error('Should resolve to visionario_estrategico');
console.log(`✓ Resolved profile: ${finalState.profile.name} (${finalState.profile.avatarName})`);

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
