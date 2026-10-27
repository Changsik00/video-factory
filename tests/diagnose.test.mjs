import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferReason, missingFromRegistry, tail } from '../scripts/lib/diagnose.mjs';

test('inferReason: 타임아웃 플래그가 최우선', () => {
  assert.equal(inferReason('anything', { timedOut: true }), 'timeout');
});

test('inferReason: webgpu 어댑터 없음 -> gpu', () => {
  assert.equal(inferReason('Error: No WebGPU adapter found (navigator.gpu is undefined)'), 'gpu');
  assert.equal(inferReason('WebGL context creation failed'), 'gpu');
});

test('inferReason: 네트워크 오류 -> network', () => {
  assert.equal(inferReason('getaddrinfo ENOTFOUND raw.githubusercontent.com'), 'network');
  assert.equal(inferReason('fetch failed'), 'network');
});

test('inferReason: 폰트 -> font', () => {
  assert.equal(inferReason('Failed to load font "Noto Sans KR"'), 'font');
});

test('inferReason: 알 수 없으면 other', () => {
  assert.equal(inferReason('something odd'), 'other');
  assert.equal(inferReason(''), 'other');
  assert.equal(inferReason(undefined), 'other');
});

test('missingFromRegistry: 없는 이름만 반환', () => {
  const items = [{ name: 'a', type: 'hyperframes:block' }, { name: 'b', type: 'hyperframes:component' }];
  assert.deepEqual(missingFromRegistry(['a', 'c'], items), ['c']);
});

test('missingFromRegistry: 블록이 아닌 항목(component)은 블록으로 인정하지 않는다', () => {
  const items = [{ name: 'b', type: 'hyperframes:component' }];
  assert.deepEqual(missingFromRegistry(['b'], items), ['b']);
});

test('tail: 마지막 N줄만, ANSI 제거', () => {
  assert.equal(tail('a\nb\n\u001b[31mc\u001b[0m\nd', 2), 'c\nd');
  assert.equal(tail('', 3), '');
});
