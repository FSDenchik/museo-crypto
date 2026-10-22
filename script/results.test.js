const assert = require('node:assert/strict');
const { calculateResults, percentage, getResultProfile } = require('./results.js');

assert.equal(percentage(0, 0), 0, 'Division by zero must return 0%');
assert.equal(getResultProfile(8).title, 'Нужна цифровая прокачка');
assert.equal(getResultProfile(9).title, 'Осмотрительный пользователь');
assert.equal(getResultProfile(15).title, 'Уверенный пользователь');
assert.equal(getResultProfile(19).title, 'Киберзнаток');

const empty = calculateResults({});
assert.equal(empty.score, 0);
assert.equal(empty.percent, 0);
assert.ok(empty.categories.every((category) => category.percent === 0));

const perfect = calculateResults({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 6, 7: 2, 8: 2, 9: 2 });
assert.equal(perfect.score, 22);
assert.equal(perfect.percent, 100);
assert.ok(perfect.categories.every((category) => category.percent === 100));

const partial = calculateResults({ 1: 1, 3: 2, 4: 2, 5: 1, 6: 3, 7: 1, 8: 2 });
assert.equal(partial.score, 12);
assert.equal(partial.percent, 55);
assert.equal(partial.categories.find((category) => category.id === 'phishing').percent, 75);
assert.equal(partial.categories.find((category) => category.id === 'wifi').percent, 50);
assert.equal(partial.categories.find((category) => category.id === 'applications').percent, 33);

console.log('Result calculation tests passed');
