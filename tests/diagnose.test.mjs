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

test('missingFromRegistry: type 을 지정하면 그 타입으로 판정한다 (component)', () => {
  const items = [{ name: 'b', type: 'hyperframes:component' }, { name: 'a', type: 'hyperframes:block' }];
  assert.deepEqual(missingFromRegistry(['b'], items, 'hyperframes:component'), []);
  assert.deepEqual(missingFromRegistry(['a'], items, 'hyperframes:component'), ['a']);
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

import { assetCopies } from '../scripts/lib/diagnose.mjs';

test('assetCopies: 하위 폴더 블록의 assets 를 프로젝트 루트 assets 로', () => {
  const written = [
    '/p/compositions/canopy-part-title/canopy-part-title.html',
    '/p/compositions/canopy-part-title/assets/leaf.webp',
    '/p/compositions/canopy-part-title/assets/sub/normal.webp',
    '/p/compositions/canopy-part-title/SKILL.md',
  ];
  assert.deepEqual(assetCopies(written, '/p'), [
    { from: '/p/compositions/canopy-part-title/assets/leaf.webp', to: '/p/assets/leaf.webp' },
    { from: '/p/compositions/canopy-part-title/assets/sub/normal.webp', to: '/p/assets/sub/normal.webp' },
  ]);
});

test('assetCopies: 이미 루트 assets 이거나 assets 폴더가 없으면 빈 배열', () => {
  assert.deepEqual(assetCopies(['/p/compositions/a.html'], '/p'), []);
  assert.deepEqual(assetCopies(['/p/assets/x.png'], '/p'), []);
});

import { summarizeCheck } from '../scripts/lib/diagnose.mjs';

const section = (e = 0, w = 0, extra = {}) => ({ ok: e === 0, errorCount: e, warningCount: w, infoCount: 0, ...extra });
const CHECK = {
  ok: true,
  lint: { ...section(0, 2), findings: [{ code: 'studio_missing_editable_id' }, { code: 'negative_z_index' }, { code: 'negative_z_index' }] },
  runtime: section(),
  layout: section(),
  motion: section(0, 0, { enabled: false }),
  contrast: section(0, 0, { enabled: true, checked: 12, passed: 12 }),
};

test('summarizeCheck: 섹션별 오류·경고 합계를 낸다', () => {
  const s = summarizeCheck(CHECK);
  assert.equal(s.ok, true);
  assert.equal(s.errors, 0);
  assert.equal(s.warnings, 2);
});

test('summarizeCheck: lint 경고 코드는 중복 없이 모은다', () => {
  assert.deepEqual(summarizeCheck(CHECK).codes, ['studio_missing_editable_id', 'negative_z_index']);
});

test('summarizeCheck: 꺼진 섹션(motion)과 대비 검사 수를 알려준다', () => {
  const s = summarizeCheck(CHECK);
  assert.deepEqual(s.disabled, ['motion']);
  assert.deepEqual(s.contrast, { checked: 12, passed: 12 });
});

test('summarizeCheck: 오류가 있으면 오류 수를 더한다', () => {
  const s = summarizeCheck({ ...CHECK, ok: false, layout: section(3, 1) });
  assert.equal(s.errors, 3);
  assert.equal(s.warnings, 3);
});

test('summarizeCheck: 알 수 없는 형태면 null (성공으로 간주하지 않는다)', () => {
  assert.equal(summarizeCheck(null), null);
  assert.equal(summarizeCheck({ foo: 1 }), null);
});
