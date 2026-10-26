# Video Factory

AI 에이전트 기반 유튜브 콘텐츠 제작 파이프라인. 주제와 참고 자료를 입력하면 리서치 → 대본 → 장면 구성 → 렌더링 → 품질 검수 → (사람 승인) → 게시 준비까지 수행하는 것을 목표로 한다.

핵심은 영상 템플릿이 아니라 **재사용 가능한 제작 시스템**이다: 콘텐츠 형식(Format), 시각 컴포넌트(Component), 제작 절차(Workflow)를 분리해 재사용하고, 변경된 부분만 다시 생성한다.

> 상태: **Phase 0 (기존 도구 조사/검증)**. 아직 구현된 기능은 없다.

## 문서
- [제안서](docs/proposal/proposal.md) — 비전, 아키텍처, 단계별 계획
- [검토 노트](docs/proposal/review.md) — 제안서의 모호점과 결정 필요 사항
- [프로젝트 원칙](docs/project-principles.md) — 이 프로젝트 고유의 원칙
- [현재 Phase](backlog/phase-01.md) — Phase 0 도구 검증 (진행 현황은 `backlog/queue.md`)
- 작업 절차는 [harness-kit](https://github.com/Changsik00/harness-kit)(SDD)을 따른다: `/hk-align`, `sdd status`

## 구조
```
apps/orchestrator/   파이프라인 실행기
packages/            content-schema, 어댑터, media-pipeline, quality-gates, artifact-store
catalog/             사람이 관리하는 formats / components / workflows
content/             주제별 콘텐츠 원본 (brief, research, script, manifest)
runs/                에이전트 실행 기록 (catalog와 분리, git 제외)
assets/, output/     미디어와 산출물 (대형 파일은 git 제외)
backlog/, specs/      harness-kit: Phase 정의, SPEC 작업 산출물
docs/                제안서, 프로젝트 원칙, 도구 검증 결과
```

## 개발 환경
Node.js >= 20, pnpm. (`pnpm install`은 패키지가 추가되는 Phase 1부터 의미가 있다.)
