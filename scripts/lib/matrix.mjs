// 자막 스타일 × 배경 조합의 계획, 이어서 실행, 이름 규칙. 외부 도구를 호출하지 않는 순수 함수만 둔다.
export const comboKey = ({ style, backdrop = null, scrim = false }) => `${style}|${backdrop ?? 'none'}|${scrim ? 'scrim' : 'plain'}`;

// 배경별로 묶어 만든다 (배경 블록 설치를 배경당 한 번만 하기 위함). done 에 있는 조합은 건너뛴다.
export function planCombos({ styles, backdrops, scrim = false, done = [], force = false }) {
  const finished = new Set(done);
  const outer = backdrops.length ? backdrops : [null];
  const plan = [];
  for (const backdrop of outer) {
    for (const style of styles) {
      const combo = { style, backdrop, scrim: Boolean(scrim) };
      if (force || !finished.has(comboKey(combo))) plan.push(combo);
    }
  }
  return plan;
}

export const outputName = ({ style, backdrop = null, scrim = false }) =>
  `${style}-ko${backdrop ? `-on-${backdrop}` : ''}${scrim ? '-scrim' : ''}.mp4`;

export const labelFor = ({ style, backdrop = null, scrim = false }) =>
  [style.replace(/^caption-/, ''), backdrop, scrim ? 'scrim' : null].filter(Boolean).join(' · ');
