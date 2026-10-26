# phase-1: tool-validation

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-1-{seq}-{slug}/spec.md` 에서 다룹니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-1` |
| **상태** | Planning |
| **시작일** | 2026-10-26 |
| **소유자** | changsik |
| **Base Branch** | 없음 |

## 🎯 배경 및 목표

### 현재 상황
Video Factory는 Hypit / HyperFrames / FFmpeg 같은 기존 도구를 조합해 영상 제작 파이프라인을 만든다. 이 도구들의 능력은 아직 가설이다 (`docs/project-principles.md` 원칙 1, 6). 제안서(`docs/proposal/proposal.md`)와 검토 노트(`docs/proposal/review.md`)에 미확정 사항이 남아 있다.

사전 조사(2026-10-26, GitHub API):

| 도구 | 저장소 | 라이선스 | 비고 |
|---|---|---|---|
| Hypit | hypit-ai/hypit | `NOASSERTION` | 라이선스 파일 직접 확인 필요. 상업적 사용 가능 여부 미확정 |
| HyperFrames | heygen-com/hyperframes | Apache-2.0 | 제안서의 `hyperframes-org/hyperframes`는 404. 실제 저장소로 정정 |

### 목표 (Goal)
각 도구의 능력·한계를 직접 실행해 실측하고, Phase 1(RAG explainer 1편)에서 쓸 도구와 역할 분담을 결정한다.

### 성공 기준 (Success Criteria)
1. Hypit 라이선스 전문 확인 및 상업적 사용 가능 여부 판정
2. 샘플 영상 1편을 실제로 렌더링하고 `ffprobe`로 검사
3. 두 도구의 역할 중복 영역(TTS / 자막 / 렌더 / 타이밍)이 표로 정리됨
4. 미확인 기능 목록이 `docs/tool-findings.md`에 기록됨

### 공통 체크 항목 (도구별)
라이선스·상업 사용 / 설치·지원 OS·Node 버전 / 공식 CLI·API / 입출력 포맷 / 재사용·부분 재생성 / 음성·영상 타이밍 / 렌더링 의존성 / 외부 API·유료 모델 의존성

## 🧩 작업 단위 (SPEC + phase-FF)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

### spec-1-01 — hypit-validation

- **요점**: Hypit 라이선스 확인, 설치, 최소 영상 빌드, 입출력 포맷·빌드 결과 재사용 방식 문서화
- **방향성**: 라이선스가 상업 채널에 부적합하면 이후 작업 중단하고 사용자에게 보고
- **참조**: `docs/proposal/review.md` 설계상 리스크 1, 3

### spec-1-02 — hyperframes-validation

- **요점**: 빈 프로젝트 초기화 + 렌더, 블록 시험 (flowchart, data-chart, code-typing, mk-callout-highlight, logo-outro)
- **방향성**: `npx hyperframes add <block>` 동작을 실제로 확인
- **참조**: `docs/proposal/proposal.md` 도구 역할

### spec-1-03 — ffmpeg-and-sample

- **요점**: FFmpeg 설치 확인 + ffprobe 검사 스크립트, 샘플 영상 1편 생성, 두 도구 역할 중복 정리, 음성 타이밍 ↔ 장면 연결 방식 확인, 결과를 `docs/tool-findings.md`에 정리
- **방향성**: spec-1-01/02 결과에 따라 도구 조합 결정. 하나로 충분하면 어댑터를 1개로 줄인다 (원칙 10)
- **참조**: `docs/proposal/review.md` 설계상 리스크 1, 4

### phase-FF 예정 항목 (spec 미생성)

없음

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 프로젝트명 | YouTube Factory / Video Factory | Video Factory | 저장소명과 일치, 쇼츠·블로그 확장 비전과 부합 |
| manifest.json vs sources.json | 택1 / 둘 다 | 둘 다 | manifest=장면 명세, sources=출처 목록 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 샘플 영상 end-to-end
- **Given**: 검증된 도구가 설치된 환경
- **When**: 문서화된 절차대로 샘플 영상 1편을 생성
- **Then**: 렌더 산출물이 `ffprobe` 검사를 통과하고, 같은 절차로 재현된다
- **연관 SPEC**: spec-1-03

## 🔗 의존성

- **선행 phase**: 없음
- **외부 시스템**: Hypit, HyperFrames, FFmpeg, Node >= 20, pnpm

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| Hypit 라이선스가 상업 사용 불가 | Hypit 제외, 설계 변경 | spec-1-01 에서 최우선 확인 |
| 두 도구 역할 중첩 | 어댑터 중복 | spec-1-03 에서 하나로 줄일지 결정 |
| 외부 도구 미설치·실패 | 검증 불가 | 모의 성공 결과를 만들지 않고 실패를 그대로 기록 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC 이 merge
- [ ] 통합 테스트 시나리오 PASS
- [ ] 성공 기준 측정 결과를 아래 "검증 결과"에 기록
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

