import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSrt, validateCues, toWords } from '../scripts/lib/srt.mjs';

const SAMPLE = `1
00:00:00,500 --> 00:00:02,500
이펙트 샘플을 보여드립니다

2
00:00:03,000 --> 00:00:05,000
첫 줄
둘째 줄
`;

test('parseSrt: 구간 시간과 텍스트를 읽는다', () => {
  const cues = parseSrt(SAMPLE);
  assert.equal(cues.length, 2);
  assert.deepEqual(cues[0], { index: 1, start: 0.5, end: 2.5, text: '이펙트 샘플을 보여드립니다' });
});

test('parseSrt: 여러 줄 자막은 공백 하나로 합친다', () => {
  assert.equal(parseSrt(SAMPLE)[1].text, '첫 줄 둘째 줄');
});

test('parseSrt: CRLF 와 BOM 을 처리한다', () => {
  const cues = parseSrt('﻿' + SAMPLE.replace(/\n/g, '\r\n'));
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 0.5);
});

test('parseSrt: 점 소수점과 시간 단위를 읽는다', () => {
  const [c] = parseSrt('1\n01:02:03.250 --> 01:02:04.000\nhi\n');
  assert.equal(c.start, 3723.25);
  assert.equal(c.end, 3724);
});

test('parseSrt: 빈 입력은 빈 배열', () => {
  assert.deepEqual(parseSrt(''), []);
});

test('parseSrt: 시간 줄이 깨진 블록은 오류를 던진다', () => {
  assert.throws(() => parseSrt('1\n00:00 -> 00:02\nhi\n'), /시간/);
});

test('validateCues: 정상 입력은 오류 없음', () => {
  assert.deepEqual(validateCues(parseSrt(SAMPLE), 10), []);
});

test('validateCues: 시작이 끝보다 늦으면 reversed', () => {
  const errs = validateCues([{ index: 1, start: 3, end: 2, text: 'a' }], 10);
  assert.deepEqual(errs.map((e) => e.code), ['reversed']);
});

test('validateCues: 구간이 겹치면 overlap', () => {
  const errs = validateCues([
    { index: 1, start: 0, end: 3, text: 'a' },
    { index: 2, start: 2, end: 4, text: 'b' },
  ], 10);
  assert.deepEqual(errs.map((e) => e.code), ['overlap']);
  assert.equal(errs[0].index, 2);
});

test('validateCues: 영상 길이를 넘으면 out_of_range', () => {
  const errs = validateCues([{ index: 1, start: 9, end: 11, text: 'a' }], 10);
  assert.deepEqual(errs.map((e) => e.code), ['out_of_range']);
});

test('validateCues: 빈 텍스트는 empty_text', () => {
  const errs = validateCues([{ index: 1, start: 0, end: 1, text: '  ' }], 10);
  assert.deepEqual(errs.map((e) => e.code), ['empty_text']);
});

test('validateCues: 맞닿는 구간(끝 = 다음 시작)은 겹침이 아니다', () => {
  const errs = validateCues([
    { index: 1, start: 0, end: 2, text: 'a' },
    { index: 2, start: 2, end: 4, text: 'b' },
  ], 10);
  assert.deepEqual(errs, []);
});

test('toWords: 공백 기준으로 나누고 글자 수 비례로 시간을 분배한다', () => {
  // "가 나나 다다다": 글자 1,2,3 → 6 등분. 구간 0~6초
  const words = toWords([{ index: 1, start: 0, end: 6, text: '가 나나 다다다' }]);
  assert.deepEqual(words.map((w) => w.text), ['가', '나나', '다다다']);
  assert.deepEqual(words.map((w) => [w.start, w.end]), [[0, 1], [1, 3], [3, 6]]);
});

test('toWords: 첫 단어는 구간 시작, 마지막 단어는 구간 끝과 정확히 맞는다', () => {
  const words = toWords([{ index: 1, start: 0.5, end: 2.5, text: '이펙트 샘플을 보여드립니다' }]);
  assert.equal(words[0].start, 0.5);
  assert.equal(words.at(-1).end, 2.5);
});

test('toWords: 단어 구간은 이어지고 겹치지 않는다', () => {
  const words = toWords([{ index: 1, start: 0.5, end: 2.5, text: '이펙트 샘플을 보여드립니다 오늘도' }]);
  for (let i = 1; i < words.length; i++) assert.equal(words[i].start, words[i - 1].end);
});

test('toWords: id 는 구간을 가로질러 w0, w1 ... 로 이어진다', () => {
  const words = toWords([
    { index: 1, start: 0, end: 2, text: '가 나' },
    { index: 2, start: 3, end: 5, text: '다' },
  ]);
  assert.deepEqual(words.map((w) => w.id), ['w0', 'w1', 'w2']);
});

test('toWords: 단어 하나면 구간 전체', () => {
  const [w] = toWords([{ index: 1, start: 1, end: 2, text: '안녕' }]);
  assert.deepEqual([w.start, w.end], [1, 2]);
});

test('toWords: 연속 공백은 단어로 세지 않는다', () => {
  const words = toWords([{ index: 1, start: 0, end: 2, text: '가   나' }]);
  assert.equal(words.length, 2);
});

test('toWords: 소수점 오차 없이 밀리초 단위로 반올림한다', () => {
  const words = toWords([{ index: 1, start: 0, end: 1, text: '가 나 다' }]);
  for (const w of words) assert.equal(w.start, Math.round(w.start * 1000) / 1000);
});
