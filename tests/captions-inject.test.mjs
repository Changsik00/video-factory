import test from 'node:test';
import assert from 'node:assert/strict';
import { cueGroups, injectWords, readDuration } from '../scripts/lib/captions-inject.mjs';

const words = [
  { id: 'w0', text: '가', start: 0, end: 1 },
  { id: 'w1', text: '나', start: 1, end: 2 },
  { id: 'w2', text: '다', start: 3, end: 4 },
];

const WORDS_HTML = `<div data-composition-id="x" data-duration="8"></div>
<script>
  var WORDS = [
    { text: "Every", start: 0.0, end: 0.3 },
    { text: "great", start: 0.3, end: 0.55 },
  ];
  var RAW_GROUPS = [
    [0, 1],
  ];
  var after = 1;
</script>`;

test('cueGroups: 구간마다 단어 인덱스 [첫, 끝] 쌍을 만든다', () => {
  const cues = [{ text: '가 나' }, { text: '다' }, { text: '라 마 바' }];
  assert.deepEqual(cueGroups(cues), [[0, 1], [2, 2], [3, 5]]);
});

test('injectWords: var WORDS 배열을 text/start/end 로 치환한다', () => {
  const out = injectWords(WORDS_HTML, words, [[0, 1], [2, 2]]);
  assert.match(out, /text: "가", start: 0, end: 1/);
  assert.doesNotMatch(out, /Every/);
});

test('injectWords: var TRANSCRIPT 배열도 치환한다', () => {
  const html = 'var TRANSCRIPT = [\n { text: "Every", start: 0, end: 1 },\n ];\nvar WORDS = normalizeWords(TRANSCRIPT);';
  const out = injectWords(html, words, []);
  assert.match(out, /text: "가"/);
  assert.match(out, /var WORDS = normalizeWords\(TRANSCRIPT\);/);
});

test('injectWords: 리터럴 RAW_GROUPS 는 구간 쌍으로 치환한다', () => {
  const out = injectWords(WORDS_HTML, words, [[0, 1], [2, 2]]);
  assert.match(out, /var RAW_GROUPS = \[\s*\[0, 1\],\s*\[2, 2\],?\s*\];/);
});

test('injectWords: RAW_GROUPS = buildGroups(...) 같은 계산식은 건드리지 않는다', () => {
  const html = 'var WORDS = [\n { text: "a", start: 0, end: 1 },\n];\nvar RAW_GROUPS = buildGroups(WORDS);';
  assert.match(injectWords(html, words, [[0, 0]]), /var RAW_GROUPS = buildGroups\(WORDS\);/);
});

test('injectWords: 배열 뒤의 코드는 그대로 둔다', () => {
  assert.match(injectWords(WORDS_HTML, words, [[0, 1]]), /var after = 1;/);
});

test('injectWords: 단어 배열이 없으면 오류 (모의 성공 금지)', () => {
  assert.throws(() => injectWords('<p>no words</p>', words, []), /단어 배열/);
});

test('injectWords: 따옴표와 역슬래시가 있는 단어도 안전하게 넣는다', () => {
  const out = injectWords(WORDS_HTML, [{ id: 'w0', text: '"인용"\\', start: 0, end: 1 }], [[0, 0]]);
  assert.match(out, /text: "\\"인용\\"\\\\"/);
});

test('readDuration: 루트 data-duration 을 읽는다', () => {
  assert.equal(readDuration(WORDS_HTML), 8);
  assert.equal(readDuration('<div data-duration="7.5">'), 7.5);
});

test('readDuration: 없으면 오류', () => {
  assert.throws(() => readDuration('<div></div>'), /data-duration/);
});
