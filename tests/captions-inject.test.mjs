import test from 'node:test';
import assert from 'node:assert/strict';
import { cueGroups, hostHtml, injectWords, readDuration } from '../scripts/lib/captions-inject.mjs';

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

test('hostHtml: 자막 컴포넌트를 id 가 있는 호스트 div 로 마운트한다', () => {
  const html = hostHtml({ id: 'caption-x', src: 'compositions/caption-x-ko.html', duration: 8 });
  assert.match(html, /id="caption-host"[^>]*data-composition-id="caption-x"[^>]*data-composition-src="compositions\/caption-x-ko.html"/);
  assert.match(html, /data-composition-id="main"[^>]*data-duration="8"/);
});

test('hostHtml: 배경이 없으면 배경 블록 div 가 없다', () => {
  const html = hostHtml({ id: 'caption-x', src: 'a.html', duration: 8 });
  assert.doesNotMatch(html, /id="backdrop"/);
});

test('hostHtml: 배경 블록은 자막보다 낮은 data-track-index 로 마운트한다', () => {
  const html = hostHtml({ id: 'caption-x', src: 'a.html', duration: 8, backdrop: { id: 'aurora', src: 'compositions/aurora.html' } });
  const track = (re) => Number(re.exec(html)[1]);
  const back = track(/id="backdrop"[^>]*data-track-index="(\d+)"/);
  const cap = track(/id="caption-host"[^>]*data-track-index="(\d+)"/);
  assert.ok(back < cap);
  assert.match(html, /id="backdrop"[^>]*data-composition-src="compositions\/aurora.html"/);
});

test('hostHtml: 배경 블록 div 는 자막 div 보다 앞에 온다', () => {
  const html = hostHtml({ id: 'caption-x', src: 'a.html', duration: 8, backdrop: { id: 'aurora', src: 'b.html' } });
  assert.ok(html.indexOf('id="backdrop"') < html.indexOf('id="caption-host"'));
});

// --- spec-01-03: 라벨, scrim, 배경 반복 ---
const base = { id: 'caption-x', src: 'compositions/caption-x-ko.html', duration: 8 };

test('hostHtml: 옵션이 없으면 라벨·scrim 이 없고 자막 호스트는 track 1', () => {
  const html = hostHtml(base);
  assert.doesNotMatch(html, /id="label"|id="scrim"/);
  assert.match(html, /id="caption-host"[^>]*data-track-index="1"/);
});

test('hostHtml: label 은 id="label" 로 들어가고 HTML 특수문자를 이스케이프한다', () => {
  const html = hostHtml({ ...base, label: 'a<b> & "c"' });
  assert.match(html, /id="label"[^>]*class="clip"|class="clip"[^>]*id="label"/);
  assert.match(html, />a&lt;b&gt; &amp; &quot;c&quot;</);
  assert.doesNotMatch(html, />a<b>/);
});

test('hostHtml: label 은 자막 호스트보다 뒤(위 레이어)에 온다', () => {
  const html = hostHtml({ ...base, label: 'x', backdrop: { id: 'aurora', src: 'b.html' } });
  assert.ok(html.indexOf('id="label"') > html.indexOf('id="caption-host"'));
});

test('hostHtml: scrim 은 배경과 자막 호스트 사이에 온다', () => {
  const html = hostHtml({ ...base, scrim: true, backdrop: { id: 'aurora', src: 'b.html' } });
  const i = (s) => html.indexOf(s);
  assert.ok(i('id="backdrop"') < i('id="scrim"') && i('id="scrim"') < i('id="caption-host"'));
  assert.match(html, /id="scrim"[^>]*class="clip"|class="clip"[^>]*id="scrim"/);
});

test('hostHtml: scrim 이 있으면 자막 호스트는 scrim 보다 높은 track', () => {
  const html = hostHtml({ ...base, scrim: true, backdrop: { id: 'aurora', src: 'b.html' } });
  const track = (id) => Number(new RegExp(`id="${id}"[^>]*data-track-index="(\\d+)"`).exec(html)[1]);
  assert.ok(track('backdrop') < track('scrim') && track('scrim') < track('caption-host'));
});

test('hostHtml: 배경 길이가 짧으면 반복 마운트한다 (2초 → 8초는 시작 0,2,4,6)', () => {
  const html = hostHtml({ ...base, backdrop: { id: 'aurora', src: 'compositions/aurora.html', duration: 2 } });
  const starts = [...html.matchAll(/data-composition-src="compositions\/aurora.html"[^>]*data-start="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(starts, [0, 2, 4, 6]);
});

test('hostHtml: 반복의 마지막 조각은 남은 길이만큼만 마운트한다 (3초 → 8초)', () => {
  const html = hostHtml({ ...base, backdrop: { id: 'x', src: 'b.html', duration: 3 } });
  const durs = [...html.matchAll(/data-composition-src="b.html"[^>]*data-duration="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(durs, [3, 3, 2]);
});

test('hostHtml: 배경이 충분히 길면 한 번만 마운트한다', () => {
  const html = hostHtml({ ...base, backdrop: { id: 'x', src: 'b.html', duration: 12 } });
  assert.equal([...html.matchAll(/data-composition-src="b.html"/g)].length, 1);
  assert.match(html, /id="backdrop"[^>]*data-duration="8"/);
});

test('hostHtml: duration 을 모르는 배경은 한 번만 마운트한다 (기존 동작)', () => {
  const html = hostHtml({ ...base, backdrop: { id: 'x', src: 'b.html' } });
  assert.equal([...html.matchAll(/data-composition-src="b.html"/g)].length, 1);
});
