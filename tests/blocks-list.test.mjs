import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const list = JSON.parse(readFileSync(new URL('../catalog/validation/blocks.json', import.meta.url), 'utf8'));

test('후보 블록은 15개', () => {
  assert.equal(list.blocks.length, 15);
});

test('이름 중복 없음', () => {
  const names = list.blocks.map((b) => b.name);
  assert.equal(new Set(names).size, names.length);
});

test('그룹이 4개 이상이고 GPU 대조군이 모두 있다', () => {
  const groups = new Set(list.blocks.map((b) => b.group));
  assert.ok(groups.size >= 4);
  for (const g of ['cpu', 'webgpu', 'webgl']) assert.ok(groups.has(g), `missing group ${g}`);
});

test('모든 항목에 name, group, 기대 dimensions/duration 이 있다', () => {
  for (const b of list.blocks) {
    assert.ok(b.name && b.group, JSON.stringify(b));
    assert.ok(b.width > 0 && b.height > 0 && b.duration > 0, b.name);
  }
});

test('세로 블록이 최소 1개', () => {
  assert.ok(list.blocks.some((b) => b.height > b.width));
});
