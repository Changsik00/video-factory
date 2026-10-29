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

import { backdropVerdict, hasScriptError, parseYavg, renderWarningCodes, summarizeCheck } from '../scripts/lib/diagnose.mjs';

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

const yavgText = (vals) => vals.map((v) => `lavfi.signalstats.YAVG=${v}`).join('\n');

test('parseYavg: 프레임별 YAVG 의 평균을 낸다', () => {
  assert.equal(parseYavg(yavgText([100, 200, 0])), 100);
});

test('parseYavg: 출력이 없으면 null', () => {
  assert.equal(parseYavg(''), null);
});

test('backdropVerdict: 렌더 평균 밝기가 배경 측정값에 가까우면 ok', () => {
  assert.equal(backdropVerdict(130, 139), 'ok');
});

test('backdropVerdict: 렌더 평균이 배경 측정값의 절반 미만이면 backdrop_missing (배경이 중간에 사라짐)', () => {
  assert.equal(backdropVerdict(35, 139), 'backdrop_missing');
});

test('backdropVerdict: 원래 어두운 배경(60 미만)은 판정하지 않는다', () => {
  assert.equal(backdropVerdict(5, 27), 'ok');
});

test('backdropVerdict: 값을 모르면 unknown', () => {
  assert.equal(backdropVerdict(null, 139), 'unknown');
  assert.equal(backdropVerdict(100, undefined), 'unknown');
});

// --- 원인 분류 보강: 정상 로그의 "WebGL renderer" 문구를 gpu 로 오분류하던 문제 ---
const INFO_GPU_LINE = '[hyperframes] browserGpuMode probe → hardware (WebGL renderer vendor="Google Inc. (Intel)" renderer="ANGLE (Intel, ANGLE Metal Renderer)")';

test('inferReason: 정상 로그의 WebGL renderer 정보 줄만으로는 gpu 가 아니다', () => {
  assert.equal(inferReason(INFO_GPU_LINE), 'other');
});

test('inferReason: Navigation timeout -> navigation_timeout (gpu 정보 줄이 같이 있어도)', () => {
  assert.equal(inferReason(`${INFO_GPU_LINE}\n✗  Render failed\n   Navigation timeout of 60000 ms exceeded`), 'navigation_timeout');
});

test('inferReason: 컴포지션 스크립트 오류 -> script_error', () => {
  assert.equal(inferReason('- sub_timeline_script_failure: A composition script threw before its timeline registered'), 'script_error');
  assert.equal(inferReason('"warningCodes":["script_error_isolated"]'), 'script_error');
});

test('renderWarningCodes: 렌더 출력에서 warningCodes 를 읽는다', () => {
  assert.deepEqual(renderWarningCodes('x {"renderJobId":"a","warningCodes":["script_error_isolated","foo"],"warningReasons":[]} y'), ['script_error_isolated', 'foo']);
});

test('renderWarningCodes: 없으면 빈 배열', () => {
  assert.deepEqual(renderWarningCodes('all good'), []);
  assert.deepEqual(renderWarningCodes(undefined), []);
});

test('hasScriptError: 스크립트 오류 계열 코드가 있으면 true', () => {
  assert.equal(hasScriptError(['script_error_isolated']), true);
  assert.equal(hasScriptError(['x', 'sub_timeline_script_failure']), true);
  assert.equal(hasScriptError(['font_fallback']), false);
  assert.equal(hasScriptError([]), false);
});

// --- check 결과를 이번 조합의 파일로 한정해 집계 ---
const f = (code, severity, file) => ({ code, severity, sourceFile: file ? `/x/compositions/${file}` : undefined });
const SCOPED = {
  ok: false,
  lint: { errorCount: 1, warningCount: 3, findings: [f('font_family_without_font_face', 'error', 'caption-emoji-pop-ko.html'), f('negative_z_index', 'warning', 'caption-highlight-ko.html'), f('composition_file_too_large', 'warning', 'caption-camera-follow-ko.html'), f('x', 'warning', 'index.html')] },
  runtime: { errorCount: 0, warningCount: 0 },
  layout: { errorCount: 0, warningCount: 0 },
  contrast: { errorCount: 2, warningCount: 0, enabled: true, checked: 5, passed: 3, findings: [f('contrast_aa_failure', 'error', 'spain-map.html'), f('contrast_aa_failure', 'error', 'caption-highlight-ko.html')] },
};
const SCOPE = { own: ['caption-highlight-ko.html', 'index.html'], backdrop: 'spain-map.html' };

test('summarizeCheck(scope): 이번 조합의 파일에서 나온 것만 오류·경고로 센다', () => {
  const s = summarizeCheck(SCOPED, SCOPE);
  assert.equal(s.errors, 1); // highlight 의 contrast 오류만
  assert.equal(s.warnings, 2); // highlight 의 negative_z_index + index.html
  assert.equal(s.ok, false);
});

test('summarizeCheck(scope): 배경 파일의 결과는 따로 센다', () => {
  assert.deepEqual(summarizeCheck(SCOPED, SCOPE).backdrop, { errors: 1, warnings: 0 });
});

test('summarizeCheck(scope): 무관한 파일의 결과는 foreign 으로만 세고 무시한다', () => {
  const s = summarizeCheck(SCOPED, SCOPE);
  assert.equal(s.foreign, 2); // emoji-pop, camera-follow
  assert.deepEqual(s.codes.sort(), ['contrast_aa_failure', 'negative_z_index', 'x']);
});

test('summarizeCheck(scope): 내 파일에 문제가 없으면 ok (다른 파일 오류가 있어도)', () => {
  const only = { ...SCOPED, lint: { ...SCOPED.lint, findings: [f('font_family_without_font_face', 'error', 'caption-emoji-pop-ko.html')] }, contrast: { ...SCOPED.contrast, findings: [] } };
  assert.equal(summarizeCheck(only, SCOPE).ok, true);
});

test('summarizeCheck(scope): sourceFile 이 없는 결과는 내 것으로 센다 (보수적)', () => {
  const unk = { ...SCOPED, lint: { ...SCOPED.lint, findings: [f('mystery', 'error', null)] }, contrast: { ...SCOPED.contrast, findings: [] } };
  const s = summarizeCheck(unk, SCOPE);
  assert.equal(s.errors, 1);
  assert.equal(s.ok, false);
});
