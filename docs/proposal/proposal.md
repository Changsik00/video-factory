# 제안서 (요약본)

## 비전
주제 + 참고 자료 → 리서치 → 대본 → 스토리보드 → 음성/시각 제작 → 렌더링 → QA → 사람 승인 → 게시 패키지.
매번 새로 만들지 않고 검증된 **Format / Component / Workflow / Asset**을 재사용하고, 변경된 장면만 재생성한다.

## 설계 원칙
Reuse Before Build · Template First · Structured Content · Deterministic Rendering · Incremental Regeneration · Human Approval · Quality Gates · Cost Awareness · Portable Assets · Agent-Friendly

## 재사용 계층
| 계층 | 예 | 위치 |
|---|---|---|
| Format | explainer, comparison, tutorial, news-analysis, short-summary | `catalog/formats` |
| Scene Template | intro, diagram, code, chart, summary, outro | `catalog/formats` 내부 |
| Visual Component | title-card, flowchart, data-chart, code-typing, callout-highlight, logo-outro | `catalog/components` |
| Workflow | 리서치→대본→장면→렌더→검수 | `catalog/workflows` |
| Media Asset | 로고, BGM, 배경 | `assets/` |

## 도구 역할 (Phase 0에서 검증 전까지는 가설)
- **Hypit** — 에이전트 기반 영상 워크플로, 빌드 결과 명시적 재사용 (가설)
- **HyperFrames** (`heygen-com/hyperframes`) — HTML/CSS/JS 장면, 블록 (`npx hyperframes add <block>`) (가설)
- **FFmpeg** — 오디오/영상 정규화, 결합, 검사, 인코딩
- **Obsidian + Markdown** — 콘텐츠 원본 관리

## 아키텍처
Content Source → Research/Script → **Content Manifest** → Format Selection → Scene Planning → (Hypit | HyperFrames) Adapter → Media Pipeline → Quality Gates → (Pass: Human Approval → Publishing Package → Upload / Fail: Targeted Repair)

## Content Manifest (개념 예시)
```json
{
  "schema_version": "1.0",
  "content_id": "rag-intro-001",
  "format": "explainer",
  "language": "ko-KR",
  "target": { "platform": "youtube", "aspect_ratio": "16:9", "resolution": { "width": 1920, "height": 1080 } },
  "scenes": [
    { "id": "scene-001", "type": "intro", "purpose": "문제 제기",
      "narration": "LLM은 왜 최신 정보를 모를까요?",
      "visual": { "component": "title-card", "renderer": "hyperframes", "props": {} },
      "assets": [], "source_refs": [], "status": "planned" }
  ]
}
```
필수: content/scene ID, format, 언어·출력 규격, 대본, 시각 컴포넌트, 에셋·출처 참조, 렌더러, 상태, 의존성, 버전. 실제 스키마는 Zod/JSON Schema로 Phase 1에서 정의.

## 부분 재생성과 캐시
- 의존성 체인: script → narration → voice → subtitle → scene.mp4 → final.mp4
- 캐시 키: 입력 해시 + 템플릿/컴포넌트/렌더러 버전 + 모델·설정 + 출력 규격 + 미디어 해시
- 재사용 조건: 입력·설정 동일, 산출물 존재, 검증 통과, 라이선스 확인. 존재만으로 재사용하지 않는다.

## 에이전트 역할
Planner · Researcher · Scriptwriter · Producer · QA · Publisher. 초기에는 자율 대화형 멀티에이전트가 아니라 **명시적 단계별 워크플로**(입출력 계약, 파일·메타데이터 기록, 재시도/비용 상한, 게시는 별도 권한 경계).

## 기술 스택
TypeScript(strict) · Node.js · pnpm workspace · Zod · Vitest · Biome 또는 ESLint(택1) · GitHub Actions. 초기엔 파일시스템 기반 상태. DB/큐/LangGraph 등은 필요성 확인 후.

## 단계
| Phase | 목표 | 완료 기준 |
|---|---|---|
| 0 | Hypit/HyperFrames 조사·검증 | 설치·실행 절차 문서화, 역할/한계 명시, 샘플 영상 생성, 미확인 기능 구분 |
| 1 | Single Video MVP (RAG explainer 1편) | 동일 입력 재현, 단계별 추적, 최종 MP4 기술 검증 |
| 2 | Reusable Catalog | comparison/tutorial, 디자인 시스템, 컴포넌트 입력 계약, 회귀 테스트 |
| 3 | Incremental Pipeline | 해시·의존성 그래프·부분 재생성·재시도·비용 기록 |
| 4 | YouTube Publishing | 제목/설명/썸네일/챕터, 승인 후 업로드, 상태 추적 |

## MVP 범위
포함: 로컬 파이프라인, 콘텐츠 명세, Explainer, 어댑터, 최소 HTML 컴포넌트, FFmpeg 통합, 결과 검사, 실행 로그, 수동 승인.
제외: 웹 편집기, 복잡한 멀티에이전트, 공동 편집, 대량 자동 생산, 무조건 자동 게시, 범용 영상 모델 지원, 계정/권한, 미검증 부분 렌더 최적화.

## 성공 지표 (수치 목표는 기준 데이터 확보 후)
제작 성공률 · 총 제작 시간 · 편당 API 비용 · 복구 성공률 · 재사용률 · 재생성 장면 수 · QA 통과율 · 수동 수정 횟수
