import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateManifest } from '../scripts/lib/manifest.mjs';

const slide = (over = {}) => ({ id: 'intro', duration: 4, heading: '제목', ...over });
const manifest = (slides = [slide()], over = {}) => ({ title: '샘플', lang: 'ko', slides, ...over });
const codes = (m, opts) => validateManifest(m, opts).errors.map((e) => `${e.path}:${e.code}`);

test('validateManifest: 최소 유효 명세는 ok 이고 오류가 없다', () => {
  const r = validateManifest(manifest());
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test('validateManifest: 모든 선택 필드를 쓴 유효 명세', () => {
  const m = manifest([
    slide({
      id: 'points',
      duration: 8,
      subheading: '부제',
      items: ['항상 보임', { text: '단계 0', step: 0 }, { text: '단계 1', step: 1 }],
      steps: [3, 6],
      image: { src: 'images/a.png', alt: '설명' },
      notes: '발표자 노트',
    }),
    slide({ id: 'end-2', duration: 2 }),
  ]);
  assert.deepEqual(validateManifest(m, { exists: () => true }).errors, []);
});

test('validateManifest: 오류는 path, code, message 를 모두 가진다', () => {
  const [e] = validateManifest(manifest([slide({ duration: 0 })])).errors;
  assert.equal(e.path, 'slides[0].duration');
  assert.equal(e.code, 'duration_invalid');
  assert.equal(typeof e.message, 'string');
  assert.ok(e.message.length > 0);
});

test('validateManifest: 객체가 아닌 명세는 거부한다', () => {
  for (const bad of [null, undefined, 'x', 3, []]) assert.deepEqual(codes(bad), [':manifest_not_object']);
});

test('validateManifest: 슬라이드가 없거나 배열이 아니면 거부한다', () => {
  assert.deepEqual(codes({ title: 'x' }), ['slides:slides_empty']);
  assert.deepEqual(codes(manifest([])), ['slides:slides_empty']);
  assert.deepEqual(codes(manifest('x')), ['slides:slides_not_array']);
});

test('validateManifest: 슬라이드가 객체가 아니면 거부한다', () => {
  assert.deepEqual(codes(manifest([null])), ['slides[0]:slide_not_object']);
});

test('validateManifest: id 중복은 뒤쪽 슬라이드에 보고한다', () => {
  assert.deepEqual(codes(manifest([slide({ id: 'a' }), slide({ id: 'a' })])), ['slides[1].id:id_duplicate']);
});

test('validateManifest: id 형식(소문자·숫자·하이픈)이 아니면 거부한다', () => {
  for (const id of ['Intro', 'a b', '-a', 'a_b', '', 3]) {
    assert.deepEqual(codes(manifest([slide({ id })])), ['slides[0].id:id_invalid'], String(id));
  }
});

test('validateManifest: duration 은 0 초과 숫자여야 한다', () => {
  for (const duration of [0, -1, '4', NaN, Infinity, undefined]) {
    assert.deepEqual(codes(manifest([slide({ duration })])), ['slides[0].duration:duration_invalid'], String(duration));
  }
});

test('validateManifest: heading 이 없거나 비어 있으면 거부한다', () => {
  for (const heading of [undefined, '', '   ', 5]) {
    assert.deepEqual(codes(manifest([slide({ heading })])), ['slides[0].heading:heading_missing'], String(heading));
  }
});

test('validateManifest: subheading, notes 는 문자열이어야 한다', () => {
  assert.deepEqual(codes(manifest([slide({ subheading: 3 })])), ['slides[0].subheading:invalid_type']);
  assert.deepEqual(codes(manifest([slide({ notes: {} })])), ['slides[0].notes:invalid_type']);
});

test('validateManifest: steps 는 숫자 배열이어야 한다', () => {
  assert.deepEqual(codes(manifest([slide({ steps: 'x' })])), ['slides[0].steps:steps_invalid']);
  assert.deepEqual(codes(manifest([slide({ steps: [1, 'a'] })])), ['slides[0].steps[1]:steps_invalid']);
});

test('validateManifest: steps 는 순증가여야 한다', () => {
  assert.deepEqual(codes(manifest([slide({ steps: [2, 2] })])), ['slides[0].steps[1]:steps_not_increasing']);
  assert.deepEqual(codes(manifest([slide({ steps: [3, 1] })])), ['slides[0].steps[1]:steps_not_increasing']);
});

test('validateManifest: steps 값은 0 초과이고 duration 이하여야 한다', () => {
  assert.deepEqual(codes(manifest([slide({ steps: [0] })])), ['slides[0].steps[0]:step_out_of_range']);
  assert.deepEqual(codes(manifest([slide({ steps: [-1] })])), ['slides[0].steps[0]:step_out_of_range']);
  assert.deepEqual(codes(manifest([slide({ steps: [4.5] })])), ['slides[0].steps[0]:step_out_of_range']);
  assert.deepEqual(codes(manifest([slide({ steps: [4] })])), []); // duration 과 같은 값은 허용
});

test('validateManifest: items 는 배열이고 원소는 문자열 또는 {text, step} 이다', () => {
  assert.deepEqual(codes(manifest([slide({ items: 'x' })])), ['slides[0].items:items_invalid']);
  assert.deepEqual(codes(manifest([slide({ items: [3] })])), ['slides[0].items[0]:item_invalid']);
  assert.deepEqual(codes(manifest([slide({ steps: [1], items: [{ step: 0 }] })])), ['slides[0].items[0].text:item_text_missing']);
  assert.deepEqual(codes(manifest([slide({ items: [{ text: '' }] })])), ['slides[0].items[0].text:item_text_missing']);
});

test('validateManifest: item.step 은 steps 인덱스 범위의 정수여야 한다', () => {
  const s = (step) => slide({ steps: [1, 2], items: [{ text: 'a', step }] });
  assert.deepEqual(codes(manifest([s(2)])), ['slides[0].items[0].step:item_step_out_of_range']);
  assert.deepEqual(codes(manifest([s(-1)])), ['slides[0].items[0].step:item_step_out_of_range']);
  assert.deepEqual(codes(manifest([s(0.5)])), ['slides[0].items[0].step:item_step_invalid']);
  assert.deepEqual(codes(manifest([s('1')])), ['slides[0].items[0].step:item_step_invalid']);
  assert.deepEqual(codes(manifest([s(1)])), []);
});

test('validateManifest: steps 없이 item.step 을 쓰면 거부한다', () => {
  assert.deepEqual(codes(manifest([slide({ items: [{ text: 'a', step: 0 }] })])), ['slides[0].items[0].step:item_step_without_steps']);
  assert.deepEqual(codes(manifest([slide({ steps: [], items: [{ text: 'a', step: 0 }] })])), ['slides[0].items[0].step:item_step_without_steps']);
});

test('validateManifest: image 는 src 문자열을 가진 객체여야 한다', () => {
  assert.deepEqual(codes(manifest([slide({ image: 'a.png' })])), ['slides[0].image:image_invalid']);
  assert.deepEqual(codes(manifest([slide({ image: { alt: 'x' } })])), ['slides[0].image.src:image_invalid']);
  assert.deepEqual(codes(manifest([slide({ image: { src: 'a.png', alt: 3 } })])), ['slides[0].image.alt:invalid_type']);
});

test('validateManifest: exists 를 주면 이미지 파일이 없을 때 거부하고 생략하면 확인하지 않는다', () => {
  const m = manifest([slide({ image: { src: 'images/none.png' } })]);
  assert.deepEqual(codes(m), []);
  assert.deepEqual(codes(m, { exists: () => false }), ['slides[0].image.src:image_missing_file']);
  assert.deepEqual(codes(m, { exists: (p) => p === 'images/none.png' }), []);
});

test('validateManifest: 알 수 없는 필드는 어느 단계에서든 거부한다 (오타 방지)', () => {
  assert.deepEqual(codes(manifest([slide()], { extra: 1 })), ['extra:unknown_field']);
  assert.deepEqual(codes(manifest([slide({ step: [1] })])), ['slides[0].step:unknown_field']);
  assert.deepEqual(codes(manifest([slide({ items: [{ text: 'a', stp: 1 }] })])), ['slides[0].items[0].stp:unknown_field']);
  assert.deepEqual(codes(manifest([slide({ image: { src: 'a.png', size: 1 } })])), ['slides[0].image.size:unknown_field']);
});

test('validateManifest: title, lang 은 선택이지만 있으면 문자열이어야 한다', () => {
  assert.deepEqual(codes({ slides: [slide()] }), []);
  assert.deepEqual(codes(manifest([slide()], { title: 3 })), ['title:invalid_type']);
  assert.deepEqual(codes(manifest([slide()], { lang: [] })), ['lang:invalid_type']);
});

test('validateManifest: 여러 오류를 한꺼번에 보고하고 예외를 던지지 않는다', () => {
  const m = manifest([slide({ id: 'A', duration: -1 }), slide({ id: 'b', heading: '' })]);
  assert.deepEqual(codes(m), ['slides[0].id:id_invalid', 'slides[0].duration:duration_invalid', 'slides[1].heading:heading_missing']);
  assert.equal(validateManifest(m).ok, false);
});

// ---- resolveTimeline ----
import { resolveTimeline } from '../scripts/lib/manifest.mjs';

const deck = () =>
  manifest([
    slide({ id: 'hook', duration: 4 }),
    slide({ id: 'points', duration: 8, steps: [3, 6] }),
    slide({ id: 'closing', duration: 4 }),
  ]);

test('resolveTimeline: 슬라이드는 순서대로 이어 붙고 전체 길이를 계산한다', () => {
  const t = resolveTimeline(deck());
  assert.deepEqual(t.slides.map((s) => [s.id, s.start, s.end]), [['hook', 0, 4], ['points', 4, 12], ['closing', 12, 16]]);
  assert.equal(t.total, 16);
});

test('resolveTimeline: fragments 는 슬라이드 시작 + 로컬 steps 의 절대 시각이다 (phase-01 덱: 7s, 10s)', () => {
  const t = resolveTimeline(deck());
  assert.deepEqual(t.slides[1].fragments, [7, 10]);
  assert.deepEqual(t.slides[0].fragments, []);
});

test('resolveTimeline: 슬라이드를 앞에 끼워 넣으면 뒤 슬라이드의 시작과 fragments 가 자동으로 이동한다', () => {
  const m = deck();
  m.slides.unshift(slide({ id: 'cover', duration: 2 }));
  const t = resolveTimeline(m);
  assert.deepEqual(t.slides.map((s) => s.start), [0, 2, 6, 14]);
  assert.deepEqual(t.slides[2].fragments, [9, 12]);
  assert.equal(t.total, 18);
});

test('resolveTimeline: 소수 길이를 더해도 부동소수 오차가 남지 않는다', () => {
  const t = resolveTimeline(manifest([slide({ id: 'a', duration: 0.1 }), slide({ id: 'b', duration: 0.2 }), slide({ id: 'c', duration: 0.3, steps: [0.1] })]));
  assert.deepEqual(t.slides.map((s) => s.end), [0.1, 0.3, 0.6]);
  assert.deepEqual(t.slides[2].fragments, [0.4]);
  assert.equal(t.total, 0.6);
});

test('resolveTimeline: 원본 슬라이드를 slide 로 돌려주고 명세를 바꾸지 않는다', () => {
  const m = deck();
  const before = JSON.stringify(m);
  const t = resolveTimeline(m);
  assert.equal(t.slides[1].slide, m.slides[1]);
  assert.equal(t.slides[1].index, 1);
  assert.equal(t.slides[1].duration, 8);
  assert.equal(JSON.stringify(m), before);
});

test('resolveTimeline: 검증을 통과하지 못한 명세는 오류 코드를 담은 예외를 던진다', () => {
  assert.throws(() => resolveTimeline(manifest([slide({ duration: 0 })])), /duration_invalid/);
  assert.throws(() => resolveTimeline(null), /manifest_not_object/);
});
