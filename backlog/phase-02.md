# phase-2: one-script-three-outputs

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-2-{seq}-{slug}/spec.md` 에서 다룹니다.
>
> 본 문서는 "이번 phase 에서 무엇을 어디까지 할 것인가" 를 한 번에 보기 위한 *업무 지도* 입니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-2` |
| **상태** | Planning |
| **시작일** | 2026-11-01 |
| **목표 종료일** | 미정 |
| **소유자** | changsik |
| **Base Branch** | 없음 |

## 🎯 배경 및 목표

### 현재 상황
phase-01 은 HyperFrames 도구의 능력을 실측했다. 블록 15개와 자막 컴포넌트 16개 × 배경 5개를 렌더했고, **3장짜리 덱 하나로 발표(`present`), PDF, MP4 를 모두 낼 수 있음**을 확인했다 (`docs/tool-findings.md`). 다만 글자·색만 있는 덱 1개, 각 방식 1회씩이고, 시험에 쓴 덱과 인쇄용 페이지 생성기는 저장소에 없다 (`runs/` 는 git 제외, 스크립트는 임시 폴더).
방향은 정해졌다. 결과물은 **하나의 대본에서 HTML(발표)·PDF(정적)·MP4(자동재생)** 로 낸다 (ADR-003), 구조는 로컬 웹앱 + HTML/GSAP 슬라이드 + Node 서버 어댑터이고 UI 는 형식 검증 뒤에 만든다 (ADR-004, proposed), 이 프로젝트는 개인 제작 도구다 (ADR-005).

### 목표 (Goal)
**하나의 대본(콘텐츠 명세, Content Manifest)에서 발표 덱·PDF·MP4 를 재현 가능하게 만드는 최소 파이프라인**을 저장소에 만든다 (명세 → 생성 → 검사). UI, 에이전트 자산 제안, Hypit, 업로드는 이 phase 의 범위 밖이다.

### 성공 기준 (Success Criteria) — 정량 우선
1. **명세 스키마와 검증**: 슬라이드(장면 id, 텍스트, 이미지 참조, 단계(fragment) 시각, 길이)를 정의하고 검증 함수가 유효·무효 명세를 구분한다. 무효 사례(겹치는 구간, 범위 밖 fragment, 없는 이미지 파일, 중복 id 등) 테스트 10개 이상 통과, 샘플 명세(5장, fragment 있는 슬라이드 2장 이상, 이미지 슬라이드 1장 이상)가 검증을 통과한다.
2. **덱 생성과 발표**: 같은 샘플 명세에서 루트 + 장면 파일 구조의 덱을 생성하고 `check --json` 통과, `present` 에서 `manifest errors` 0건으로 슬라이드 5장과 모든 fragment 단계를 키 입력으로 끝까지 진행한다 (자동 확인 스크립트가 저장소에 있음).
3. **PDF**: 같은 명세에서 벡터 PDF 를 만든다. 쪽 수 = 슬라이드 수, 텍스트 슬라이드의 글자가 추출되고, 이미지 슬라이드를 포함해 쪽마다 최종 상태를 프레임으로 눈으로 확인한다.
4. **MP4**: 같은 명세에서 MP4 를 렌더한다. `ffprobe` 길이가 명세 장면 길이 합과 ±1초 이내, 1920x1080 h264, 프레임으로 장면 순서와 단계 시점을 확인한다.
5. **덱 오류 자동 가드**: 깨진 덱 2종(루트 없음, 없는 `sceneId`)이 자동으로 실패로 판정되고 정상 덱은 통과한다 (`check` 가 못 잡던 오류).
6. **이월 부채 해소**: `slideshow` 스킬의 lock 방식을 결정·기록하고, 러너 본체에 대한 최소 1개의 통합 검증과 일괄 실행 진입점(예: `npm run smoke`)이 있다.
7. 위 1~4 의 산출물에 대해 사용자가 기능 동작을 확인한다 (스타일 판정은 요구하지 않음).

## 🧩 작업 단위 (SPEC + phase-FF)

> 본 절은 phase 의 *작업 지도* 입니다. 실질적/불확실 → **SPEC**(아래 표), 작고 가역적인 1–2 commit → **phase-FF**. 이 phase 는 base branch 를 쓰지 않으므로 phase-FF 는 사용하지 않는다.
> SPEC 은 *요점 + 방향성 + 참조* 까지만 적습니다. 자세한 spec/task 는 `specs/spec-2-{seq}-{slug}/` 에서 작성합니다.
> sdd 가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신하므로 마커는 그대로 두세요.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`
> sdd가 ship 시 자동으로 `Merged`로 갱신합니다. `In Progress`는 active spec에 자동 마킹됩니다.

### spec-2-01 — manifest-schema

- **요점**: 대본(콘텐츠 명세)의 최소 스키마와 검증 함수, 5장짜리 샘플 명세
- **방향성**: 슬라이드 = 장면 파일 하나 + 순서 있는 단계(fragment 시각) + 길이. 순수 함수로 TDD(유효·무효 사례 중심). 새 프레임워크는 만들지 않는다 (원칙 6). 샘플 명세는 `catalog/` 에 둔다 (원칙 7)
- **참조**: `docs/plan/multi-format-presentation-plan.md` §3, ADR-003, `docs/tool-findings.md` 덱 절
- **연관 모듈**: `scripts/lib/` 아래 새 모듈(미정), `tests/`, `catalog/`

### spec-2-02 — deck-generator

- **요점**: 명세에서 루트 + 장면 파일 덱을 생성하고 `present` 진행을 자동으로 확인한다. 깨진 덱을 자동으로 잡는 가드
- **방향성**: 처음에 만든 최상위 장면 구조는 `present` 가 동작하지 않았고 `check` 도 통과시켰다. 생성기는 표준 구조만 만들고, 가드는 `present` 콘솔(`manifest errors`)과 키 진행을 헤드리스 Chrome 으로 확인한다. CDP 구동 스크립트를 저장소에 보존 (phase-01 C6)
- **참조**: `docs/tool-findings.md` (present, 덱 렌더), `.claude/skills/slideshow/`
- **연관 모듈**: `scripts/`, `tests/`

### spec-2-03 — pdf-mp4-outputs

- **요점**: 같은 명세에서 벡터 PDF 와 MP4 를 만들고 검사한다. 이미지 슬라이드를 포함해 시험
- **방향성**: PDF 는 장면 파일에서 인쇄용 페이지를 생성해 Chrome 으로 인쇄한다 (장면 파일은 인쇄용 페이지에서도 실행되도록 작성: 전역 `const` 충돌 회피, 런타임 없는 `window.__timelines` 가정 금지). 이미지·영상·3D 장면은 확인하지 못했으므로 이미지 슬라이드 1장부터 시작해 실패하면 원인을 기록한다. 검사는 쪽 수, 글자 추출, `ffprobe`, 프레임 확인
- **참조**: `docs/tool-findings.md` (덱 PDF, 덱 렌더), ADR-003
- **연관 모듈**: `scripts/`, `tests/`

### spec-2-04 — carry-over-debt

- **요점**: phase-01 이월 부채 묶음 (bundle)
- **방향성**: `slideshow` lock 방식 결정, 러너 본체 통합 검증과 일괄 실행 진입점, `render-blocks.mjs` 결과 덮어쓰기와 러너 중복·환경 설정 불일치 정리, `visual: ok` 상태명을 검사 범위가 드러나게 변경하고 자막 누락 감지가 실제로 발동하는지 검증. 장시간 일괄 실행 전에 3조합 파일럿을 둔다
- **참조**: `backlog/phase-01.md` "phase-02 이월 항목", phase-01 회고
- **연관 모듈**: `scripts/`, `tests/`, `skills-lock.json`, `package.json`

### phase-FF 예정 항목 (spec 미생성)

없음 (base branch 를 쓰지 않는 phase)

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| phase 범위 | 대본→3출력 파이프라인 / 자산 제안·UI 포함 | 파이프라인만 | ADR-004: UI 는 출력 형식 검증 뒤. 에이전트 자산 제안은 명세가 있어야 의미가 있음 |
| spec 순서 | 명세→덱→PDF·MP4 / 부채 먼저 | 명세 → 덱 → PDF·MP4, 부채 spec 은 병행·마지막 | 각 출력이 명세에 의존한다. 부채 중 가드·lock 은 덱 단계에서 필요해지면 앞당긴다 |
| 이월 부채 처리 | 항목마다 spec / 하나로 묶기 | 한 spec 으로 묶음(bundle) | 같은 테마(phase-01 이월) 소규모 항목이 3개 이상 |
| 개인 도구 vs 제품 | 미정 / 개인 | 개인 도구 (ADR-005) | 사용자 결정(2026-10-31). Hypit 은 이 phase 에서 쓰지 않음 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 명세 → 덱 → 발표
- **Given**: 5장 샘플 명세 (fragment 슬라이드 2장 이상, 이미지 슬라이드 1장 이상), HyperFrames CLI 0.8.206
- **When**: 덱을 생성하고 `present` 를 띄워 헤드리스 Chrome 으로 키 입력 진행
- **Then**: `check` 통과, `manifest errors` 0, 모든 슬라이드와 fragment 단계가 순서대로 진행
- **연관 SPEC**: spec-2-01, spec-2-02

### 시나리오 2: 같은 명세 → PDF + MP4
- **Given**: 시나리오 1 의 샘플 명세
- **When**: PDF 와 MP4 를 생성
- **Then**: PDF 쪽 수 = 슬라이드 수·글자 추출 가능, MP4 `ffprobe` 길이가 명세와 일치, 프레임으로 장면 순서 확인
- **연관 SPEC**: spec-2-03

### 통합 테스트 실행
```bash
npm test            # 단위 테스트
npm run smoke       # (spec-2-04 에서 추가 예정) 3조합 파일럿 + 명세 → 세 출력 요약
```

## 🔗 의존성

- **선행 phase**: phase-01 (완료)
- **외부 시스템**: HyperFrames CLI 0.8.206 (고정), `slideshow` 스킬(프로젝트 복사본), 헤드리스 Chrome(`hyperframes browser`), ffmpeg/ffprobe, 검사용 poppler(`pdfinfo`, `pdftotext`, 이 Mac 에 설치되어 있음 — 다른 환경 필요 여부는 미확인), Node >= 22
- **연관 ADR**:
  - `docs/decisions/ADR-003-multi-format-output.md`
  - `docs/decisions/ADR-004-local-webapp-present-first.md`
  - `docs/decisions/ADR-005-personal-tool-first.md`

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| 이미지·영상·3D 장면이 인쇄용 PDF 에서 깨진다 (phase-01 에서 글자·색만 확인) | PDF 가 일부 장면 유형만 지원 | 이미지 슬라이드 1장으로 먼저 시험, 실패는 원인과 함께 기록하고 지원 범위를 문서화 |
| 장면 파일이 인쇄용 페이지나 렌더에서 충돌 (전역 `const`, 런타임 없는 `window.__timelines`) | 생성기가 장면마다 보정 필요 | 생성기가 즉시 실행 함수 래핑·id 치환 규칙을 갖고 테스트로 고정 |
| `slideshow` 스킬이 GitHub main 기준이라 고정 CLI 0.8.206 과 다를 수 있음 | 문서와 실측 불일치 | 시험은 0.8.206 으로만, 문서와 다르면 실측을 따르고 기록 |
| 레지스트리가 main 을 실행 시점에 읽어 재현성이 외부 상태에 의존 | 같은 절차의 결과가 바뀜 | 사용한 항목 이름과 확인 시점을 기록, 가능하면 설치본을 `catalog/` 로 고정 |
| 장시간 렌더가 PC 부하를 키움, 1차 실행 오염 사건 재발 | 시간 손실, 거짓 성공 | 전체 실행 전 3조합 파일럿, 4개씩 나눠 실행, `check` 결과는 조합 범위로 한정 |
| 사용자 판정이 반복해서 미수령 | 가독성·스타일이 에이전트 판독에 머묾 | 이 phase 는 기능 동작 확인을 기준으로 하고 스타일 판정은 요구하지 않음 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC 이 merge (일반 모드: 각 spec → main)
- [ ] 통합 테스트 전 시나리오 PASS
- [ ] 성공 기준 정량 측정 결과 (본 문서 하단 "검증 결과" 섹션에 기록)
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
