# spec-01-02: 자막 스타일 시험과 SRT 변환

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-01-02` |
| **Phase** | `phase-01` |
| **Branch** | `spec-01-02-caption-styles` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Research |
| **작성일** | 2026-10-28 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황
첫 제품은 무음 이펙트 쇼케이스이며 자막만 넣는다 (ADR-001). 자막 입력은 사람이 정한 타이밍의 SRT다 (`docs/plan/product-and-script-plan.md` §4).
레지스트리에는 `caption-style` 태그 컴포넌트가 16개 있다 (`catalog --tag caption-style`, 0.8.206 확인). 설치한 스킬(`references/captions.md`)은 자막 입력을 단어 타이밍 `[{id,text,start,end}]`로 설명한다.
스킬 문서가 알려주는 사실(문서 기준, 아직 실측 전):
- 타이밍은 전사(transcribe)나 음성에서 얻는 것이 전제다. 음성이 없는 우리는 SRT 구간에서 만들어야 한다.
- 띄어쓰기 없는 문자(중·일)는 구간 시간을 글자 수 비례로 나누라고 안내한다. 한국어는 띄어쓰기가 있어 단어 단위 분할이 가능하다.
- 컴포넌트는 독립 렌더되는 블록과 달리 호스트 컴포지션에 붙여넣는 코드 조각이다.

### 문제점
- SRT → 단어 타이밍 균등 분배의 결과가 자막 스타일에서 자연스러운지 모른다.
- 컴포넌트 16개가 한글에서 깨지는지, 붙이는 절차가 자동화 가능한지 모른다.
- 지금 쓰는 검증 도구는 블록용이라 컴포넌트에는 그대로 못 쓴다.

### 해결 방안
SRT 파서·단어 분배·검증 로직을 순수 함수로 만들고(TDD), 같은 한국어 문장과 같은 SRT로 자막 스타일 5개를 렌더해 한글 표시와 변환 품질을 실측한다.

## 요구사항

1. `captions.srt`를 파싱하고 구간 오류(역전, 겹침, 영상 길이 초과, 빈 텍스트)를 검출한다.
2. 각 구간을 공백 기준 단어로 나누고 구간 시간을 글자 수 비례로 분배해 `[{id,text,start,end}]`를 만든다 (단어 하나에 두 단어를 넣지 않는다, 시작과 끝이 구간과 정확히 맞는다).
3. 자막 컴포넌트 5개를 같은 한국어 문장 SRT로 렌더한다 (후보: `caption-highlight`, `caption-pill-karaoke`, `caption-clip-wipe`, `caption-weight-shift`, `caption-glitch-rgb`). 설치가 안 되거나 붙이는 데 실패하면 그 사실과 원인을 기록하고 대체 후보로 채운다.
4. 각 결과를 성공/부분/실패로 분류하고, 한글 표시(두부 여부), 화면 검사(blank/static), 단어 강조가 구간에 맞는지(프레임 확인)를 기록한다.
5. 컴포넌트를 호스트에 붙이는 방식이 스타일마다 다른 정도를 기록한다 (자동화 가능 여부 판단 근거).
6. `npx hyperframes check --json`을 호스트 컴포지션에 실행하고 결과를 기록한다 (스킬의 공식 검증 루프).
7. 실패는 로그 그대로 기록한다. 모의 성공을 만들지 않는다. 결과는 `docs/tool-findings.md`에 추가한다.

## Out of Scope

- 음성 전사, TTS (ADR-001)
- 샘플 영상 한 편 제작, 오버레이 배경 합성, 라이선스·작성자 정리 (spec-01-03)
- 나머지 11개 자막 컴포넌트의 시험, 세로(portrait) 자막
- 자막 스타일의 미적 우열 평가 (사용자 판정은 받되 기준을 세우지 않는다)
- 영어 병기

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 시험 스타일 5개 선정이 맞는가? (실사용 가능성이 높은 것 위주: 단어 강조 2, 와이프 1, 미니멀 1, 효과 1)
> - [ ] 시험 문장은 한국어 두세 문장(약 30~40자)으로 내가 정한다. 바꾸고 싶은 문장이 있는가?
> - [ ] 시각 품질·한글 표시 판정은 사용자가 한다. 프레임 시트와 mp4 경로를 제공한다.

> [!WARNING]
> - [ ] 컴포넌트는 호스트에 붙이는 방식이라 스타일별 수작업이 들 수 있다. 자동화가 어렵다는 것이 결과일 수 있다 (정상적인 결과).
> - [ ] 단어 균등 분배는 실제 발화가 없으니 의미 있는 강조 위치가 아니다. 이 spec은 "동작 여부와 보이는 모양"만 본다.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 입력 | `content/`가 아닌 `catalog/validation/captions.srt` (시험용 고정 SRT) | 재현 가능, 사람이 관리하는 자산 (원칙 7) |
| 변환 | 순수 함수 `scripts/lib/srt.mjs` (parse / validate / toWords) | 외부 도구 없이 단위 테스트 가능한 부분만 TDD |
| 호스트 | 러너가 스타일마다 샌드박스에 프로젝트를 만들고, 컴포넌트를 add 한 뒤 호스트 HTML에 조립 | 블록 러너(`render-blocks.mjs`)와 같은 샌드박스·고정 버전 사용 |
| 검증 | `check --json` + ffprobe + signalstats + 프레임 확인 | 스킬 루프 + 기존 거짓 성공 방지 |
| CLI | `npx hyperframes@0.8.206` 고정, 텔레메트리 off | `docs/project-principles.md` |

## Proposed Changes

#### [NEW] `scripts/lib/srt.mjs`, `tests/srt.test.mjs`
`parseSrt(text)`, `validateCues(cues, duration)`, `toWords(cues)`. 검증 오류는 항목별 코드로 반환.

#### [NEW] `catalog/validation/captions.srt`, `catalog/validation/caption-styles.json`
시험 문장 SRT와 스타일 후보 목록(이름, 대체 후보).

#### [NEW] `scripts/render-captions.mjs`
스타일별 샌드박스 프로젝트 생성 → 컴포넌트 add → 호스트 조립 → `check --json` → 렌더 → ffprobe·signalstats. 결과를 `runs/phase-01/captions-results.json|md`에 기록.

#### [MODIFY] `docs/tool-findings.md`
자막 컴포넌트 절 추가: 결과표, 한글 표시, 변환 품질, 붙이는 절차 난이도, 미확인.

## 검증 계획

```bash
npm test                                     # srt 단위 테스트 포함
node scripts/render-captions.mjs --dry-run   # SRT 검증, 스타일 후보가 레지스트리에 있는지
node scripts/render-captions.mjs             # 실제 렌더 (수 분)
```

수동 검증:
1. 5개 스타일의 중간 프레임 시트를 열어 한글이 두부로 나오지 않는지 확인
2. mp4 하나를 재생해 단어 강조가 SRT 구간과 어긋나지 않는지 확인
3. 일부러 겹치는 SRT를 넣으면 검증이 오류로 막는지 확인 (단위 테스트로 대체 가능)

## 롤백 계획

새 파일 위주이고 기존 파일은 `docs/tool-findings.md`에 절만 추가한다. `git revert`로 충분하다. `runs/`는 git 제외.

## ADR 후보

- [ ] 없음. 자막 입력 형식(SRT + 단어 분배)이 확정되면 phase-02에서 ADR로 남길 수 있음.

## ✅ Definition of Done

- [ ] 모든 테스트 PASS
- [ ] 자막 컴포넌트 5개(또는 대체 포함)의 결과와 원인이 `docs/tool-findings.md`에 기록됨
- [ ] 한글 표시와 단어 분배 품질에 대한 사용자 판정이 기록됨
- [ ] `walkthrough.md`와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-01-02-caption-styles` 브랜치 push 완료
