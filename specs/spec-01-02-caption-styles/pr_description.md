feat(spec-01-02): validate caption components and srt word timing

## 📋 Summary

### 배경 및 목적
첫 제품(무음 이펙트 쇼케이스, ADR-001)은 자막만 넣는다. 자막 컴포넌트가 사람이 정한 타이밍(SRT)으로 동작하는지, 한글이 깨지지 않는지, 배경 위에서 읽히는지, 스타일 수정 주문이 반영되는지를 실측했다.

### 주요 변경 사항
- [x] SRT 파서·검증·단어 분배 (`scripts/lib/srt.mjs`): 구간을 공백 단어로 나누고 글자 수 비례로 시간 분배
- [x] 컴포넌트 예시 단어 치환과 루트 호스트 HTML 생성 (`scripts/lib/captions-inject.mjs`)
- [x] 렌더 러너 `scripts/render-captions.mjs`: 조립 → `check --json` → 렌더 → ffprobe → 화면 검사, `--backdrop`으로 블록 배경 위 렌더
- [x] 러너 결함 수정: 컴포넌트를 레지스트리에서 못 찾던 문제, `check` 경고가 숨던 문제
- [x] 실측 결과 `docs/tool-findings.md`: 자막 단독 5/5, 배경 위 15/15 렌더, 스타일 수정 실험

### Phase 컨텍스트
- **Phase**: `phase-01` (tool-validation)
- **본 SPEC 의 역할**: 자막 입력(SRT → 단어 타이밍)과 컴포넌트 사용 방식을 확정하고 한계를 기록한다.

## 🎯 Key Review Points

1. **결과 해석의 한계**: 스타일 5개, 한 문장, 블록 배경 3개 범위다. "다양한 스타일 × 다양한 영상"의 쇼케이스 확장은 하지 않았고 이월했다.
2. **`check`는 가독성 기준이 아니다**: 안 읽히는 렌더가 통과하고, 배경 블록 자체의 오류가 자막 오류로 섞인다. 가독성 판정은 프레임을 눈으로 봐야 한다.
3. **사용자 판정 미수령**: 한글 표시·타이밍·가독성의 "읽힘/안 보임"은 AI 판독이다.

## 🧪 Verification

### 자동 테스트
```bash
npm test
```

**결과 요약**:
- ✅ 75개 PASS, 0 fail (srt 파싱/검증/분배, 단어 치환, 호스트 HTML, 진단·`check` 요약)

### 수동 검증 시나리오
1. 자막 단독 5개 스타일 → 5/5 성공, 한글 두부 없음, 강조가 구간을 따라감
2. 블록 배경 3종 × 5개 스타일 → 렌더 15/15, 밝은 배경에서 흰 글자 3개 스타일이 묻힘
3. `caption-highlight` 수정 주문 5개 → 4개 반영, 1개 AI 누락

## 📦 Files Changed

### 🆕 New Files
- `scripts/lib/srt.mjs`, `scripts/lib/captions-inject.mjs`, `scripts/render-captions.mjs`
- `tests/srt.test.mjs`, `tests/captions-inject.test.mjs`
- `catalog/validation/captions.srt`, `catalog/validation/caption-styles.json`
- `specs/spec-01-02-caption-styles/`: spec, task, walkthrough, pr_description

### 🛠 Modified Files
- `scripts/lib/diagnose.mjs`, `tests/diagnose.test.mjs`: `missingFromRegistry` type 인자, `summarizeCheck`
- `docs/tool-findings.md`: 자막 컴포넌트 절 추가
- `backlog/phase-01.md`, `backlog/queue.md`: spec-01-01 Merged 정정, spec-01-02 등록

## ✅ Definition of Done

- [x] 모든 테스트 PASS
- [x] 자막 컴포넌트 결과와 원인이 `docs/tool-findings.md`에 기록됨
- [ ] 한글 표시와 단어 분배 품질에 대한 사용자 판정 (미수령, 이월)
- [x] `walkthrough.md`와 `pr_description.md` 작성 및 ship commit
- [x] 브랜치 push 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-02-caption-styles/walkthrough.md`
- 결과: `docs/tool-findings.md`
- 방향: `docs/decisions/ADR-001-showcase-first-silent.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
