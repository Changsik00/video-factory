import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { backdrops } = JSON.parse(readFileSync(new URL('../catalog/validation/backdrops.json', import.meta.url), 'utf8'));

test('배경은 4~5개이고 이름이 중복되지 않는다', () => {
  assert.ok(backdrops.length >= 4 && backdrops.length <= 5);
  assert.equal(new Set(backdrops.map((b) => b.name)).size, backdrops.length);
});

test('각 배경은 측정값(yavg, ydif, duration)과 역할을 가진다', () => {
  for (const b of backdrops) {
    for (const k of ['yavg', 'ydif', 'duration']) assert.equal(typeof b[k], 'number', `${b.name}.${k}`);
    assert.ok(typeof b.role === 'string' && b.role.length > 0, `${b.name}.role`);
  }
});

test('밝음(>180), 중간(60~180), 어두움(<60) 배경이 모두 있다', () => {
  assert.ok(backdrops.some((b) => b.yavg > 180), 'bright');
  assert.ok(backdrops.some((b) => b.yavg >= 60 && b.yavg <= 180), 'mid');
  assert.ok(backdrops.some((b) => b.yavg < 60), 'dark');
});

test('움직임이 큰 배경(ydif 5 이상)이 하나 이상 있다', () => {
  assert.ok(backdrops.some((b) => b.ydif >= 5));
});

test('repeat 는 길이가 8초 미만일 때만 true 이다', () => {
  for (const b of backdrops) assert.equal(b.repeat, b.duration < 8, b.name);
});
