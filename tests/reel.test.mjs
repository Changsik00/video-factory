import { test } from 'node:test';
import assert from 'node:assert/strict';
import { concatList, selectReel } from '../scripts/lib/reel.mjs';

const row = (name, backdrop, status = 'success', extra = {}) => ({ key: `${name}|${backdrop}|plain`, name, backdrop, scrim: false, status, output: `renders/${name}-ko-on-${backdrop}.mp4`, ...extra });
const BACKDROPS = ['b1', 'b2', 'b3'];
const styles = ['s1', 's2', 's3'];
const all = styles.flatMap((s) => BACKDROPS.map((b) => row(s, b)));

test('selectReel: 스타일마다 perStyle 개를 서로 다른 배경에서 고른다', () => {
  const { picks } = selectReel(all, { styles, backdrops: BACKDROPS, perStyle: 2 });
  for (const s of styles) {
    const mine = picks.filter((p) => p.name === s);
    assert.equal(mine.length, 2);
    assert.equal(new Set(mine.map((p) => p.backdrop)).size, 2);
  }
});

test('selectReel: 스타일 순서를 유지한다', () => {
  const { picks } = selectReel(all, { styles, backdrops: BACKDROPS, perStyle: 1 });
  assert.deepEqual(picks.map((p) => p.name), styles);
});

test('selectReel: 배경이 한쪽으로 몰리지 않게 스타일마다 시작 배경을 돌려 쓴다', () => {
  const { picks } = selectReel(all, { styles, backdrops: BACKDROPS, perStyle: 1 });
  assert.deepEqual(picks.map((p) => p.backdrop), ['b1', 'b2', 'b3']);
});

test('selectReel: success 만 고른다 (partial/failed 제외)', () => {
  const rows = [row('s1', 'b1', 'partial'), row('s1', 'b2', 'failed'), row('s1', 'b3', 'success')];
  const { picks } = selectReel(rows, { styles: ['s1'], backdrops: BACKDROPS, perStyle: 2 });
  assert.deepEqual(picks.map((p) => p.backdrop), ['b3']);
});

test('selectReel: scrim 변형은 모음에 넣지 않는다', () => {
  const rows = [row('s1', 'b1', 'success', { scrim: true }), row('s1', 'b2')];
  const { picks } = selectReel(rows, { styles: ['s1'], backdrops: BACKDROPS, perStyle: 2 });
  assert.deepEqual(picks.map((p) => p.backdrop), ['b2']);
});

test('selectReel: 사람이 안 읽힌다고 판정한 조합(exclude)은 뺀다', () => {
  const { picks } = selectReel(all, { styles: ['s1'], backdrops: BACKDROPS, perStyle: 1, exclude: ['s1|b1|plain'] });
  assert.equal(picks[0].backdrop, 'b2');
});

test('selectReel: 쓸 수 있는 조합이 하나도 없는 스타일은 missing 으로 알려준다', () => {
  const rows = [row('s1', 'b1', 'failed'), row('s2', 'b1')];
  const { picks, missing } = selectReel(rows, { styles: ['s1', 's2'], backdrops: BACKDROPS, perStyle: 1 });
  assert.deepEqual(picks.map((p) => p.name), ['s2']);
  assert.deepEqual(missing, ['s1']);
});

test('selectReel: 가능한 조합이 perStyle 보다 적으면 있는 만큼만', () => {
  const rows = [row('s1', 'b2')];
  const { picks } = selectReel(rows, { styles: ['s1'], backdrops: BACKDROPS, perStyle: 3 });
  assert.equal(picks.length, 1);
});

test('concatList: ffmpeg concat 형식의 file 줄을 만든다', () => {
  assert.equal(concatList(['/a/x.mp4', '/b/y.mp4']), "file '/a/x.mp4'\nfile '/b/y.mp4'\n");
});

test('concatList: 경로의 작은따옴표를 이스케이프한다', () => {
  assert.equal(concatList(["/a/it's.mp4"]), "file '/a/it'\\''s.mp4'\n");
});
