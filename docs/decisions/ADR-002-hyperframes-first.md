---
id: ADR-002
type: decision
date: 2026-10-27
status: accepted
---

# ADR-002: 렌더 도구는 HyperFrames 하나로 시작하고 Hypit은 보류한다

## 📚 Context
제안서는 Hypit, HyperFrames, FFmpeg를 조합하는 구성이었다. 조사 결과(저장소 README, LICENSE, registry 직접 확인):
- HyperFrames(Apache-2.0)는 HTML을 결정적으로 MP4로 렌더하고 완결된 블록·자막 컴포넌트를 제공한다. spec-01-01에서 후보 블록 15개 전부가 이 환경에서 렌더에 성공했다 (`docs/tool-findings.md`).
- Hypit(수정 Apache-2.0)은 생성 모델과 음성 정렬이 강점이고, 예시 기준 18~26초 클립당 약 $1.1이 든다. 본인 조직 업무 사용은 허용되나 SaaS 제공·재판매는 금지다 (법률 검토 아님).
- 제안서의 `hyperframes-org/hyperframes`는 404였고 실제 저장소는 `heygen-com/hyperframes`다.

## 🎯 Decision
Phase 1~에서 렌더 도구는 HyperFrames로 한정하고 FFmpeg/ffprobe는 검사용으로만 쓴다. Hypit은 설치·라이선스 최소 점검만 하고, 생성형 장면이 필요해지면 재검토한다. 외부 도구 호출은 어댑터를 통한다 (`docs/project-principles.md` 원칙 4).

## 📊 Consequences
- **긍정**: 검증 범위가 좁아지고 비용·외부 의존이 줄어든다. 결과가 결정적이라 재현 가능하다.
- **부정**: 레지스트리가 main 브랜치를 실행 시점에 읽기 때문에 고정되지 않는다. 생성형 영상이 필요한 기획은 지금 못 한다. 블록별 권리·크레딧 처리가 남은 과제다 (spec-01-03).
- **중립**: HyperFrames CLI는 0.8.206으로 고정해 호출한다.

## 🔀 Alternatives
- **Hypit 중심**: 생성 모델 활용 — 비채택 이유: 쇼케이스에 필요성이 낮고 비용이 들며 정렬 기능은 음성이 없으면 의미가 줄어든다.
- **둘 다 처음부터 통합**: 제안서 원안 — 비채택 이유: 능력이 가설인 도구를 동시에 엮으면 실패 원인 분리가 어렵다 (원칙 1, 6).

## 📌 Status
Accepted (2026-10-27). 재검토 조건: 생성형 장면이 필요해지거나 블록 소재가 부족해질 때.

## 🔗 Related
- `docs/tool-findings.md`
- `docs/proposal/review.md`
- `backlog/phase-01.md`
