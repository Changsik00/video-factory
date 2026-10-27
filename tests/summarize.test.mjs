import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, metaMismatches, summarize, toMarkdown } from '../scripts/lib/summarize.mjs';

const ok = (over = {}) => ({
  name: 'code-highlight', group: 'cpu', ms: 5000,
  probe: { width: 1920, height: 1080, duration: 5.0 },
  expected: { width: 1920, height: 1080, duration: 5 },
  ...over,
});

test('metaMismatches: 일치하면 빈 배열', () => {
  assert.deepEqual(metaMismatches(ok()), []);
});

test('metaMismatches: 해상도 불일치를 보고', () => {
  const m = metaMismatches(ok({ probe: { width: 1280, height: 720, duration: 5 } }));
  assert.equal(m.length, 1);
  assert.match(m[0], /resolution/);
});

test('metaMismatches: 길이 허용 오차 0.5초', () => {
  assert.deepEqual(metaMismatches(ok({ probe: { width: 1920, height: 1080, duration: 5.4 } })), []);
  assert.equal(metaMismatches(ok({ probe: { width: 1920, height: 1080, duration: 6.2 } })).length, 1);
});

test('metaMismatches: probe 가 없으면 비교하지 않는다', () => {
  assert.deepEqual(metaMismatches(ok({ probe: undefined })), []);
});

test('classify: 렌더 실패 -> failed', () => {
  assert.equal(classify({ name: 'x', renderExit: 1 }), 'failed');
});

test('classify: 렌더 성공 + probe 일치 -> success', () => {
  assert.equal(classify({ ...ok(), renderExit: 0 }), 'success');
});

test('classify: 렌더 성공 + 메타 불일치 -> partial', () => {
  const r = { ...ok({ probe: { width: 1280, height: 720, duration: 5 } }), renderExit: 0 };
  assert.equal(classify(r), 'partial');
});

test('classify: 렌더 성공이지만 probe 없음 -> partial (검증 불가)', () => {
  assert.equal(classify({ ...ok({ probe: undefined }), renderExit: 0 }), 'partial');
});

test('summarize: 상태별 개수와 그룹별 개수', () => {
  const s = summarize([
    { name: 'a', group: 'cpu', status: 'success', ms: 1000 },
    { name: 'b', group: 'webgpu', status: 'failed', reason: 'gpu', ms: 200 },
    { name: 'c', group: 'webgpu', status: 'success', ms: 3000 },
  ]);
  assert.deepEqual(s.counts, { success: 2, partial: 0, failed: 1, total: 3 });
  assert.deepEqual(s.byGroup.webgpu, { success: 1, partial: 0, failed: 1, total: 2 });
});

test('summarize: 빈 입력', () => {
  const s = summarize([]);
  assert.deepEqual(s.counts, { success: 0, partial: 0, failed: 0, total: 0 });
});

test('toMarkdown: 헤더와 행, 실패 원인 포함', () => {
  const md = toMarkdown([
    { name: 'aurora', group: 'webgpu', status: 'failed', reason: 'no GPU adapter', ms: 1200 },
    { name: 'data-chart', group: 'cpu', status: 'success', ms: 4000 },
  ]);
  assert.match(md, /\| 블록 \| 그룹 \| 결과 \| 원인 \| 시간\(초\) \|/);
  assert.match(md, /\| aurora \| webgpu \| failed \| no GPU adapter \| 1\.2 \|/);
  assert.match(md, /\| data-chart \| cpu \| success \| - \| 4\.0 \|/);
});
