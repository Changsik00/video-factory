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
| Hypit | hypit-ai/hypit | 수정 Apache-2.0 | LICENSE 전문 확인: 본인 조직 업무(상업 포함) 허용, SaaS 제공·재판매 금지, 로고/저작권 표기 제거 금지 |
| HyperFrames | heygen-com/hyperframes | Apache-2.0 | 제안서의 `hyperframes-org/hyperframes`는 404. 실제 저장소로 정정 |

### 목표 (Goal)
첫 제품 방향은 **이펙트·샘플 쇼케이스**(음성 없음, 자막만)이다 (`docs/plan/product-and-script-plan.md`). 이 phase는 HyperFrames 레지스트리의 블록·자막 컴포넌트를 직접 렌더해, 쇼케이스를 만들 수 있는지와 한계를 실측한다.

### 성공 기준 (Success Criteria)
1. 카테고리별 블록 10개 이상(GPU 의존 webgpu/webgl 블록 포함)을 렌더하고 성공/실패/원인을 표로 기록
2. `caption-*` 자막 컴포넌트 3개 이상을 같은 문장으로 렌더하고 한글 표시를 확인
3. 샘플 영상 1편을 렌더하고 `ffprobe`로 검사
4. 블록 라이선스·작성자 필드의 실제 상태와 크레딧 표기 방침을 기록
5. Hypit 라이선스 전문 확인 결과를 기록 (이미 확인: 수정 Apache-2.0, 본인 채널 운영 허용으로 읽힘 — 사용자 판단 필요)
6. 미확인 기능 목록이 `docs/tool-findings.md`에 기록됨

### 공통 체크 항목 (도구별)
라이선스·상업 사용 / 설치·지원 OS·Node 버전 / 공식 CLI·API / 입출력 포맷 / 재사용·부분 재생성 / 음성·영상 타이밍 / 렌더링 의존성 / 외부 API·유료 모델 의존성

## 🧩 작업 단위 (SPEC + phase-FF)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-01-01` | hyperframes-blocks | P? | Active | `specs/spec-01-01-hyperframes-blocks/` |
<!-- sdd:specs:end -->

### spec-1-01 — hyperframes-blocks

- **요점**: HyperFrames 설치, 빈 프로젝트 렌더, 카테고리별 블록 10개 이상 렌더 (전환, 오버레이, 배경, 3D, 코드, 차트, 세로, GPU 의존 블록 포함)
- **방향성**: 실패는 숨기지 않고 원인(GPU, 의존성, 폰트)과 함께 기록. 렌더 시간도 측정
- **참조**: `docs/plan/product-and-script-plan.md` §2

### spec-1-02 — caption-styles

- **요점**: `caption-*` 컴포넌트 3개 이상 시험, 한글 렌더, SRT → 자막 입력 변환 가능성 (구 단위 / 단어 균등분배)
- **방향성**: 음성 없이 사람이 정한 타이밍으로 동작하는지 확인. 단어 타이밍 JSON 요구사항 문서화
- **참조**: `docs/plan/product-and-script-plan.md` §4

### spec-1-03 — ffmpeg-sample-and-findings

- **요점**: FFmpeg 설치 확인 + ffprobe 검사 스크립트, 샘플 영상 1편(블록+자막) 생성, 라이선스·작성자 필드 정리, Hypit 설치·라이선스 최소 점검, 결과를 `docs/tool-findings.md`에 정리
- **방향성**: spec-1-01/02 결과로 쇼케이스 실현 가능 범위를 결정. 도구는 HyperFrames 하나로 시작
- **참조**: `docs/proposal/review.md` 설계상 리스크 1

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
- **외부 시스템**: Hypit, HyperFrames, FFmpeg, Node >= 22 (HyperFrames 요구), pnpm

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| GPU 의존 블록이 이 환경에서 렌더 불가 | 카탈로그 일부 제외 | spec-1-01 에서 비율 측정, 제외 목록 기록 |
| 블록 라이선스·작성자 권리 불명확 | 업로드 시 문제 | spec-1-03 에서 필드 상태 정리, 크레딧 방침 결정 |
| 템플릿 모음이 YouTube 수익화 정책에 걸림 | 수익화 불가 | 변형·해설 등 편집 기여 기준 마련 (기획 문서 §2) |
| 외부 도구 미설치·실패 | 검증 불가 | 모의 성공 결과를 만들지 않고 실패를 그대로 기록 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC 이 merge
- [ ] 통합 테스트 시나리오 PASS
- [ ] 성공 기준 측정 결과를 아래 "검증 결과"에 기록
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

