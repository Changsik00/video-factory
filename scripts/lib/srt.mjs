// SRT 파싱·검증, 구간 → 단어 타이밍 변환. 순수 함수만 둔다.
const TIME = /^(\d+):(\d{2}):(\d{2})[,.](\d{1,3})$/;

function toSeconds(s) {
  const m = TIME.exec(s.trim());
  if (!m) throw new Error(`시간 형식이 잘못되었습니다: "${s.trim()}"`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, '0')) / 1000;
}

const round3 = (n) => Math.round(n * 1000) / 1000;

export function parseSrt(text) {
  const blocks = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, i) => {
    const lines = block.split('\n');
    const hasIndex = /^\d+$/.test(lines[0].trim());
    const timeLine = lines[hasIndex ? 1 : 0] ?? '';
    const [a, b] = timeLine.split('-->');
    if (b === undefined) throw new Error(`시간 줄이 없습니다 (블록 ${i + 1}): "${timeLine}"`);
    return {
      index: hasIndex ? Number(lines[0]) : i + 1,
      start: toSeconds(a),
      end: toSeconds(b),
      text: lines.slice(hasIndex ? 2 : 1).join(' ').replace(/\s+/g, ' ').trim(),
    };
  });
}

// 오류는 { code, index, message } 로 반환한다. 비어 있으면 통과.
export function validateCues(cues, duration) {
  const errors = [];
  const add = (code, c, message) => errors.push({ code, index: c.index, message });
  cues.forEach((c, i) => {
    if (c.start >= c.end) add('reversed', c, `시작(${c.start})이 끝(${c.end})보다 늦거나 같습니다`);
    if (c.start < 0 || c.end > duration) add('out_of_range', c, `영상 길이 ${duration}초를 벗어납니다`);
    if (!c.text.trim()) add('empty_text', c, '텍스트가 비어 있습니다');
    const prev = cues[i - 1];
    if (prev && c.start < prev.end) add('overlap', c, `앞 구간(${prev.index})과 겹칩니다`);
  });
  return errors;
}

// 구간을 공백 기준 단어로 나누고 글자 수 비례로 시간을 분배한다.
// 첫 단어는 구간 시작, 마지막 단어는 구간 끝에 정확히 맞춘다.
export function toWords(cues) {
  const words = [];
  for (const c of cues) {
    const parts = c.text.split(/\s+/).filter(Boolean);
    const total = parts.reduce((n, p) => n + [...p].length, 0);
    const span = c.end - c.start;
    let used = 0;
    parts.forEach((text, i) => {
      const start = i === 0 ? c.start : words.at(-1).end;
      used += [...text].length;
      const end = i === parts.length - 1 ? c.end : round3(c.start + (span * used) / total);
      words.push({ id: `w${words.length}`, text, start: round3(start), end: round3(end) });
    });
  }
  return words;
}
