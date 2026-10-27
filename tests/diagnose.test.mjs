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

import { compositionPath, parseSignalstats, visualVerdict } from '../scripts/lib/diagnose.mjs';

test('compositionPath: 단일 파일 블록', () => {
  const written = ['/x/compositions/code-highlight.html'];
  assert.equal(compositionPath('code-highlight', written, '/x'), 'compositions/code-highlight.html');
});

test('compositionPath: 하위 폴더 블록(assets, SKILL.md 포함)', () => {
  const written = [
    '/x/compositions/canopy-part-title/canopy-part-title.html',
    '/x/compositions/canopy-part-title/assets/leaf.webp',
    '/x/compositions/canopy-part-title/SKILL.md',
  ];
  assert.equal(compositionPath('canopy-part-title', written, '/x'), 'compositions/canopy-part-title/canopy-part-title.html');
});

test('compositionPath: 이름이 맞는 html 이 없으면 null', () => {
  assert.equal(compositionPath('a', ['/x/compositions/b.html'], '/x'), null);
  assert.equal(compositionPath('a', [], '/x'), null);
});

const stats = (rows) => rows.map(([avg, max, dif], i) =>
  `frame:${i}    pts:${i}\nlavfi.signalstats.YAVG=${avg}\nlavfi.signalstats.YMAX=${max}\nlavfi.signalstats.YDIF=${dif}`).join('\n');

test('parseSignalstats: 프레임 수, YMAX 최대, YDIF 최대', () => {
  const s = parseSignalstats(stats([[10, 50, 0], [30, 200, 0.4], [20, 100, 0.2]]));
  assert.deepEqual(s, { frames: 3, ymaxMax: 200, ydifMax: 0.4 });
});

test('parseSignalstats: 출력이 없으면 frames 0', () => {
  assert.equal(parseSignalstats('').frames, 0);
});

test('visualVerdict: 움직임 있는 정상 영상', () => {
  assert.equal(visualVerdict({ frames: 90, ymaxMax: 240, ydifMax: 0.3 }), 'ok');
});

test('visualVerdict: 미세하지만 움직임이 있는 영상(회전 오브 등)은 ok', () => {
  assert.equal(visualVerdict({ frames: 60, ymaxMax: 234, ydifMax: 0.05 }), 'ok');
});

test('visualVerdict: 전부 검은 화면 -> blank', () => {
  assert.equal(visualVerdict({ frames: 90, ymaxMax: 16, ydifMax: 0 }), 'blank');
});

test('visualVerdict: 프레임 간 변화가 거의 없으면 static', () => {
  assert.equal(visualVerdict({ frames: 300, ymaxMax: 243, ydifMax: 0.0053 }), 'static');
});

test('visualVerdict: 프레임 정보가 없으면 unknown', () => {
  assert.equal(visualVerdict({ frames: 0, ymaxMax: 0, ydifMax: 0 }), 'unknown');
});
