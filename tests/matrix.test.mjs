import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comboKey, labelFor, outputName, planCombos } from '../scripts/lib/matrix.mjs';

test('comboKey: 스타일|배경|변형 으로 구분한다', () => {
  assert.equal(comboKey({ style: 'a', backdrop: 'x' }), 'a|x|plain');
  assert.equal(comboKey({ style: 'a', backdrop: 'x', scrim: true }), 'a|x|scrim');
  assert.equal(comboKey({ style: 'a' }), 'a|none|plain');
});

test('planCombos: 배경별로 묶어 순서대로 만든다 (배경 설치를 한 번만 하기 위해)', () => {
  const plan = planCombos({ styles: ['s1', 's2'], backdrops: ['b1', 'b2'] });
  assert.deepEqual(plan.map((c) => `${c.backdrop}/${c.style}`), ['b1/s1', 'b1/s2', 'b2/s1', 'b2/s2']);
});

test('planCombos: 배경이 없으면 배경 없는 조합만 만든다', () => {
  const plan = planCombos({ styles: ['s1', 's2'], backdrops: [] });
  assert.deepEqual(plan, [{ style: 's1', backdrop: null, scrim: false }, { style: 's2', backdrop: null, scrim: false }]);
});

test('planCombos: 이미 끝난 조합은 건너뛴다', () => {
  const plan = planCombos({ styles: ['s1', 's2'], backdrops: ['b1'], done: ['s1|b1|plain'] });
  assert.deepEqual(plan.map((c) => c.style), ['s2']);
});

test('planCombos: force 면 끝난 조합도 다시 만든다', () => {
  const plan = planCombos({ styles: ['s1'], backdrops: ['b1'], done: ['s1|b1|plain'], force: true });
  assert.equal(plan.length, 1);
});

test('planCombos: scrim 변형은 plain 과 키가 달라 따로 취급한다', () => {
  const plan = planCombos({ styles: ['s1'], backdrops: ['b1'], scrim: true, done: ['s1|b1|plain'] });
  assert.equal(plan.length, 1);
  assert.equal(plan[0].scrim, true);
});

test('outputName: 기존 파일 이름 규칙을 유지하고 scrim 은 접미사를 붙인다', () => {
  assert.equal(outputName({ style: 'caption-highlight', backdrop: 'swirl' }), 'caption-highlight-ko-on-swirl.mp4');
  assert.equal(outputName({ style: 'caption-highlight', backdrop: 'swirl', scrim: true }), 'caption-highlight-ko-on-swirl-scrim.mp4');
  assert.equal(outputName({ style: 'caption-highlight', backdrop: null }), 'caption-highlight-ko.mp4');
});

test('labelFor: caption- 접두어를 떼고 배경과 변형을 표기한다', () => {
  assert.equal(labelFor({ style: 'caption-highlight', backdrop: 'swirl' }), 'highlight · swirl');
  assert.equal(labelFor({ style: 'caption-highlight', backdrop: 'swirl', scrim: true }), 'highlight · swirl · scrim');
  assert.equal(labelFor({ style: 'caption-highlight', backdrop: null }), 'highlight');
});
