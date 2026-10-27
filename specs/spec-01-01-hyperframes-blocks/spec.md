# spec-01-01: HyperFrames 블록 렌더 검증

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-01-01` |
| **Phase** | `phase-01` |
| **Branch** | `spec-01-01-hyperframes-blocks` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Research |
| **작성일** | 2026-10-27 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황
첫 제품은 이펙트·샘플 쇼케이스(음성 없음, 자막만)다 (`docs/plan/product-and-script-plan.md`). 소재는 HyperFrames 레지스트리의 블록 210개인데, 문서 조사만 했고 **실제로 렌더된 적이 없다**.
환경(확인함): macOS x86_64, Node v22.14.0(요구 22+ 충족), FFmpeg 8.1.1, npm `hyperframes` 0.8.206.

### 문제점
- 블록 중 webgpu 40, webgl 17개 등은 헤드리스 Chrome 렌더에 GPU/플래그가 필요할 수 있고, 이 Mac(Intel)에서 되는지 모른다.
- 렌더 시간, 실패 유형, 결과 품질, 한글 표시를 모른 채로는 카탈로그·샘플 클립 phase를 설계할 수 없다.

### 해결 방안
카테고리를 고르게 섞은 블록 15개를 실제로 설치·렌더하고, 성공/실패/원인/렌더 시간을 표로 기록한다. GPU 의존 블록과 비의존 블록을 대조군으로 비교한다.

## 요구사항

1. 빈 HyperFrames 프로젝트를 초기화하고 렌더가 성공한다 (smoke test).
2. 아래 후보 블록 15개를 `hyperframes add` 후 렌더한다. 각 결과를 `성공 / 실패 / 부분 성공(깨짐)` 로 분류하고 원인(GPU, 의존성, 폰트, 기타)과 렌더 시간을 기록한다.
3. 렌더 결과는 `ffprobe`로 해상도·길이·코덱을 읽어 블록 메타(`registry-item.json`)의 dimensions/duration과 일치하는지 대조한다.
4. 텍스트 변수가 있는 블록 2개 이상에서 값을 한국어로 바꿔 렌더하고 글자가 깨지지 않는지 눈으로 확인한다 (판정은 사용자 확인 필요).
5. 모의 성공을 만들지 않는다. 실패는 로그 그대로 기록한다 (`docs/project-principles.md`).
6. 재현 가능한 실행 절차(명령, 버전)를 `docs/tool-findings.md` HyperFrames 절에 남긴다.

### 후보 블록 (조사 시점 레지스트리 기준)

| 그룹 | 블록 |
|---|---|
| GPU 비의존 추정 (대조군, 9) | `code-highlight`, `data-chart`, `lt-bold-block`, `hw-title`, `editorial-flash-overlay`, `beat-freeze-cut`, `chatgpt-exchange`(세로 1080x1920), `canopy-part-title`, `spain-map` |
| webgpu (3) | `aurora`, `chrome-orb`, `color-wheel` |
| webgl / shader (2) | `code-3d-extrude`, `cinematic-zoom` |
| 3D (1) | `camera-dolly-zoom` |

"GPU 비의존"은 태그(webgpu/webgl/shader/3d 없음) 기준 추정이며 실측으로 확인한다. `color-wheel`은 조사 후 webgpu 태그가 확인되어 대조군에서 옮겼다.

## Out of Scope

- `caption-*` 자막 컴포넌트 시험 (spec-01-02)
- 샘플 영상 1편 제작, 라이선스·작성자 정리, Hypit 점검 (spec-01-03)
- 전체 210개 일괄 렌더 (phase-03)
- 렌더 결과의 미적 품질 평가 기준 수립

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 렌더 산출물(`runs/phase-01/`)은 git 제외, 판정 요약만 `docs/tool-findings.md`에 커밋한다. 괜찮은가?
> - [ ] 시각 품질·한글 표시는 AI가 판정할 수 없다. 포스터 프레임 몇 장과 MP4 경로를 제공하면 사용자가 확인한다.

> [!WARNING]
> - [ ] `hyperframes add`와 렌더는 npm 패키지 다운로드와 Chrome 구동을 수반한다. 설치는 `runs/phase-01/hf-sandbox/` 안에 한정하고 전역 설치는 하지 않는다.
> - [ ] 실패율이 높으면(예: GPU 블록 전멸) 쇼케이스 범위가 줄어든다. 이는 이 spec의 정상적인 결과다.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 실행 위치 | `runs/phase-01/hf-sandbox/` (git 제외) | 원칙 7: 실행 기록은 `catalog/`와 분리 |
| 대상 목록 | `catalog/validation/blocks.json` (커밋) | 사람이 관리하는 자산, 재현 가능 |
| 러너 | `scripts/render-blocks.mjs` — 목록을 읽어 add→render→ffprobe 수행, 결과 JSON을 `runs/`에 기록 | 같은 절차를 phase-03에서 재사용 |
| 결과 해석 | 순수 함수(`scripts/lib/summarize.mjs`)로 분리해 단위 테스트 | 외부 도구 없이 검증 가능한 부분만 테스트, 렌더 자체는 실측 |
| 요약 | `docs/tool-findings.md` 표로 사람이 읽을 수 있게 정리 | 완료 기준 |

## Proposed Changes

#### [NEW] `catalog/validation/blocks.json`
후보 블록 목록과 그룹, 기대 dimensions/duration(레지스트리 메타 기준).

#### [NEW] `scripts/lib/summarize.mjs`, `tests/summarize.test.mjs`, `tests/blocks-list.test.mjs`
렌더 결과 레코드(`name, status, reason, ms, probe`)를 요약표(Markdown)와 통계로 변환. 메타 불일치 판정 포함. `node --test`로 실행.

#### [NEW] `scripts/render-blocks.mjs`
샌드박스 초기화, 블록별 add/render/ffprobe, 실패 시 stderr 마지막 N줄 기록. 재시도는 블록당 1회까지(원칙: 같은 실패 반복 금지).

#### [NEW] `docs/tool-findings.md`
HyperFrames 절: 환경, 절차, 결과표, 미확인 목록.

#### [MODIFY] `package.json`
`test` 스크립트 추가(`node --test "tests/*.test.mjs"`; Node 22.14 는 디렉터리 인자를 받지 않음), `engines.node` 를 `>=22`로 정정. 의존성 추가 없음.

## 검증 계획

```bash
npm test                                 # node --test "tests/*.test.mjs"
node scripts/render-blocks.mjs --dry-run # 목록·레지스트리 이름 검증 (렌더 없음)
node scripts/render-blocks.mjs           # 실제 렌더 (수 분 소요 예상)
ffprobe -v error -show_streams runs/phase-01/hf-sandbox/renders/<블록>.mp4
```

수동 검증 시나리오:
1. 대조군(GPU 비의존) 블록 중 하나를 `open`으로 재생 — 기대: 재생되고 애니메이션이 보인다.
2. GPU 블록의 성공/실패 결과를 표와 로그로 확인 — 기대: 성공 시 화면이 깨지지 않고, 실패 시 원인이 기록돼 있다.
3. 한국어로 바꾼 렌더의 포스터를 확인 — 기대: 글자가 두부(□)로 나오지 않는다.

## 롤백 계획

- 전부 새 파일이며 `package.json`의 `test` 한 줄 외에 기존 파일을 바꾸지 않는다. `git revert`로 충분하다.
- `runs/phase-01/`은 git 제외 폴더라 지워도 무방하다. 전역 설치는 없다.

## ADR 후보

- [ ] 없음 (결과에 따라 "GPU 블록 처리 정책"을 phase-02에서 ADR로 남길 수 있음)

## ✅ Definition of Done

- [ ] 모든 테스트 PASS
- [ ] 후보 15개 전부 결과(성공/실패/부분)와 원인이 `docs/tool-findings.md`에 기록됨
- [ ] 한국어 표시 확인 결과를 사용자가 판정해 기록함
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-01-01-hyperframes-blocks` 브랜치 push 완료
