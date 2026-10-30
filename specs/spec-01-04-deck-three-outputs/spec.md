# spec-01-04: 덱 하나로 발표·PDF·MP4 실측

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-01-04` |
| **Phase** | `phase-01` |
| **Branch** | `spec-01-04-deck-three-outputs` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Research (+ 필요 시 소규모 Feature) |
| **작성일** | 2026-10-30 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황
ADR-003(accepted)은 결과물을 HTML(발표)·PDF(정적)·MP4(자동재생)로 정하고 "슬라이드 = 최종 상태 + 순서 있는 단계, 같은 HTML 을 세 형식에 쓴다"를 결정 2로 두었다. ADR-004(proposed)는 로컬 웹앱 구조와 발표 우선 흐름을 제안한다. 둘 다 `docs/plan/multi-format-presentation-plan.md` 의 **미검증 가설**에 기대고 있다.
2026-10-30 `slideshow` 스킬 문서(GitHub main, 웹 조회)에서 확인한 것 (고정 버전 0.8.206 과 같은지 미확인):
- 덱은 슬라이드를 하나의 마스터 타임라인 위 장면으로 두고, fragment(발표 중 한 번에 하나씩 드러나는 정지 지점)가 있다. 이동은 재생이 아니라 탐색(seek)이다.
- 슬라이드 순서·노트·fragment 는 본문 상단의 JSON 한 덩어리(`slides`, `slideSequences`)가 원본이다.
- **"덱을 MP4 로 렌더하지 마라. `render` 는 첫 장면만 남기고 조용히 잘라 버린다."** 이유는 적혀 있지 않다.
- PDF 언급은 없고, 정지 이미지는 `snapshot --at` 을 슬라이드별로 쓰라고 한다. 화살표 키·슬라이드 전환 스타일은 문서에서 확인하지 못했다.
이 저장소에는 `slideshow` 스킬이 설치되어 있지 않다 (`.claude/skills/` 에 hyperframes, hyperframes-cli, hyperframes-registry 만 있음).

### 문제점
- ADR-003 결정 2(같은 HTML 공유)는 덱 형식에서 성립하지 않을 가능성이 있다.
- `present` 가 이 환경에서 동작하는지, 어떤 키로 진행되는지, 전환이 가능한지 모른다.
- PDF 를 어떻게 낼지(이미지 vs 벡터) 비교한 적이 없다.
- 하나의 명세에서 덱·영상용 HTML 을 만드는 생성이 가능한지 모른다.
- YouTube 업로드 제약을 문서로 확인하지 않았다.

### 해결 방안
3장짜리 덱 하나(fragment 포함)를 만들어 `present` 발표, PDF, MP4 를 실제로 낸다. 불가한 부분은 원인과 함께 기록하고, 필요하면 같은 명세에서 덱과 영상용 HTML 을 각각 만드는 최소 생성기를 시험한다. 결과로 ADR-003/004 와 기획 문서를 수정한다.

## 요구사항

1. `slideshow` 스킬을 설치하고(사용자 확인 후) `skills-lock.json` 해시와 `docs/project-principles.md` 의 스킬 목록·검토일을 갱신한다.
2. 3장짜리 덱(슬라이드 1개 이상에 fragment 2개 이상)을 만들고 `check --json` 을 통과시킨다.
3. **V1**: `present` 를 로컬에서 띄워 진행 키(화살표 여부), fragment 진행, 슬라이드 전환, 발표자·청중 화면 동기화를 확인한다. 가능한 부분은 헤드리스 Chrome 으로 자동 확인하고, 자동화가 안 되는 부분(키 입력 체감 등)은 사용자가 직접 확인한 결과를 받는다. 확인하지 못한 것은 미확인으로 쓴다.
4. **V2**: 덱을 `render` 해 "첫 장면만 남는" 현상을 재현하고, 같은 장면들을 덱 컴포넌트 없는 일반 컴포지션으로 두면 전부 재생되는지 비교한다. 렌더는 draft, 같은 실패 재시도는 1회까지.
5. **V3**: 슬라이드별 최종 상태를 PDF 로 낸다. (a) `snapshot --at` PNG 를 묶는 이미지 PDF (b) 헤드리스 Chrome 인쇄 PDF. 페이지 수, 글자 선택 가능 여부, 잘림, 애니메이션 중간 상태 여부를 비교한다.
6. **V4**: V2 결과 덱·영상용 HTML 이 따로 필요하면, 작은 명세(JSON) 하나에서 두 HTML 을 만드는 최소 생성기를 TDD 로 시험한다. 필요 없다면(같은 HTML 로 가능) 이 요구사항은 건너뛰고 사유를 기록한다.
7. **V5**: YouTube 업로드 제약(API 승인, 미심사 프로젝트의 공개 범위, 할당량)을 **공식 문서 기준으로 조사만** 한다. 업로드는 하지 않는다.
8. 결과를 `docs/tool-findings.md` 에 기록하고 ADR-003/004 와 `docs/plan/multi-format-presentation-plan.md` 를 결과에 맞게 수정한다 (가설이 틀렸으면 틀렸다고 쓴다).

## Out of Scope

- 에이전트가 대본에서 자산(이미지·애니메이션·효과음)을 제안·생성하는 루프
- Hypit 사용, 이미지·영상 생성
- React UI, 로컬 웹앱 서버
- 실제 YouTube 업로드, `publish`/`cloud`/`lambda`/`cloudrun` 등 외부로 나가는 명령
- 음성·음악·효과음, PPTX
- 덱 디자인 품질 (이 spec 은 동작 가능 여부만 본다)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `slideshow` 스킬 설치 (`npx skills add heygen-com/hyperframes --skill slideshow` 또는 CLI 가 제공하는 방법). 스킬 파일이 `.claude/skills/` 에 추가되고 `skills-lock.json` 이 바뀐다. **Task 1 에서 설치 직전에 사용자 확인을 받는다.** 거부하면 문서 내용만으로 덱을 직접 만들어 시험하고 V1 의 신뢰도가 낮아졌다고 기록한다.
> - [ ] `present` 는 로컬 서버를 띄워 브라우저를 연다 (외부 게시 아님). 포트 3004 사용.

> [!WARNING]
> - [ ] V2 결과에 따라 ADR-003 결정 2 가 수정된다 ("같은 HTML 공유" → "명세 공유, HTML 은 형식별"). 이는 이미 accepted 인 ADR 의 변경이므로 수정 내용을 PR 에서 명시한다.
> - [ ] 문서가 main 기준이라 고정 CLI 0.8.206 과 다를 수 있다. 시험은 반드시 0.8.206 로 하고, 문서와 다른 점은 실측 쪽을 따른다.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 덱 | `slideshow` 스킬로 3장 + fragment | 기존 구현체 우선 (원칙 1) |
| 위험 순서 | V1 → V2 → V3 → V4 → V5 | V2 가 틀리면 ADR-003 구조가 바뀌므로 먼저 확인하되, V1 이 안 되면 V2 이후가 의미 없다 |
| 검증 | 눈으로 본 프레임·페이지·실제 키 입력 | 렌더 결과를 확인하지 않고 검증 완료라고 하지 않는다 (금지 원칙) |
| 실패 처리 | 원인과 함께 기록, 같은 실패 재시도 금지 | 재시도는 횟수·비용 상한 안에서만 |
| 중단 조건 | V1 에서 `present` 가 동작하지 않으면 원인 기록 후 V2·V3 은 일반 컴포지션 기준으로만 진행 | 덱 없이도 PDF·MP4 는 시험 가능 |

## Proposed Changes

#### [MODIFY] `skills-lock.json`, `docs/project-principles.md`
`slideshow` 스킬 해시와 검토 기준일, 스킬 목록 반영 (사용자 확인 후).

#### [NEW] `.claude/skills/slideshow/` (스킬 설치로 생성)
외부 스킬 파일. 직접 수정하지 않는다.

#### [NEW] `runs/phase-01/deck/` (git 제외)
시험용 덱, 스냅샷, PDF, 렌더 결과. 산출물은 `catalog/` 에 넣지 않는다 (원칙 7).

#### [NEW] `scripts/lib/deck-manifest.mjs`, `tests/deck-manifest.test.mjs` (V4 가 필요할 때만)
최소 명세(JSON) 검증과 덱/영상용 HTML 생성. 불필요하면 만들지 않는다.

#### [MODIFY] `docs/tool-findings.md`, `docs/decisions/ADR-003-*.md`, `ADR-004-*.md`, `docs/plan/multi-format-presentation-plan.md`
실측 결과 기록과 가설 수정.

## 검증 계획

```bash
npx hyperframes@0.8.206 check --json          # 덱 통과
npx hyperframes@0.8.206 present runs/phase-01/deck --no-open   # V1
npx hyperframes@0.8.206 render ... --quality draft              # V2 (덱, 일반 컴포지션)
npx hyperframes@0.8.206 snapshot --at ...                       # V3
npm test                                                        # V4 를 만들었을 때 포함
```

수동 검증 시나리오:
1. `present` 화면에서 키 입력으로 슬라이드·fragment 가 진행되는가 — 기대: 순서대로 드러남 (**사용자 확인 요청 항목**)
2. 덱 `render` 결과의 길이와 장면 수 — 기대(문서): 첫 장면만 남음. 재현되는지 기록
3. PDF 열기 — 기대: 페이지 수 = 슬라이드 수, (b) 는 글자 선택 가능
4. MP4 `ffprobe` + 프레임 시트로 장면 순서·시간 확인

## 롤백 계획

- 문서·설정 변경은 `git revert`. 스킬 설치는 `.claude/skills/slideshow/` 삭제와 `skills-lock.json` 복원.
- `runs/` 산출물은 git 제외라 삭제하면 된다. 외부 서비스 부수효과 없음.

## ADR 후보

- [x] ADR-003 결정 2 수정 가능 (V2 결과에 따라). 수정이면 이 spec 의 PR 에서 갱신
- [ ] ADR-004 proposed → accepted 승격 여부는 V1~V4 결과로 판단

## ✅ Definition of Done

- [ ] V1~V5 결과가 확인한 것·못 한 것을 구분해 `docs/tool-findings.md` 에 기록됨
- [ ] ADR-003/004, 기획 문서가 결과와 일치하도록 수정됨
- [ ] 모든 테스트 PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-01-04-deck-three-outputs` 브랜치 push 완료
