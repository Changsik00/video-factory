# Project Principles

Video Factory에 한정된 원칙. 일반 SDD 절차(Plan Accept, TDD, 브랜치, 승인 권한 등)는 harness-kit(`.harness-kit/agent/`)이 정한다. 여기에는 중복해서 적지 않는다.
변경하려면 spec(`specs/`)으로 근거를 남긴다.

## 설계 원칙
1. 구현 전에 기존 구현체를 조사하고, 있으면 직접 만들지 않는다.
2. 시스템은 공통 콘텐츠 명세(Content Manifest)를 중심으로 연결한다.
3. 콘텐츠 형식(Format), 시각 컴포넌트(Component), 워크플로(Workflow)를 분리한다.
4. 모든 외부 도구 호출은 어댑터를 통한다.
5. 각 단계의 입출력 계약을 명시한다.
6. 불필요한 추상화와 중복 프레임워크를 도입하지 않는다.
7. `catalog/`(사람이 관리하는 자산)와 `runs/`(에이전트 실행 기록)를 섞지 않는다.

## 금지
- 외부 도구가 없을 때 모의 성공 결과를 만들지 않는다.
- 렌더링 결과를 확인하지 않았다면 검증 완료라고 말하지 않는다. 검증되지 않은 기능은 구현된 것으로 취급하지 않는다.
- 승인된 산출물을 명시적 변경 없이 덮어쓰지 않는다.
- 사용자 승인 없이 외부 게시/업로드를 하지 않는다.
- 재시도는 횟수·비용 상한 안에서만 한다. 같은 실패를 반복하지 않는다.

## HyperFrames 스킬 사용 규칙
`.claude/skills/`의 `hyperframes`, `hyperframes-cli`, `hyperframes-registry`는 `skills-lock.json`의 해시로 고정한다 (2026-10-28 검토 기준). 스킬 지시와 이 문서가 충돌하면 이 문서가 우선한다.
- CLI는 `npx hyperframes@0.8.206`으로 고정해 호출한다. `skills update`, `upgrade`는 spec 없이 실행하지 않는다.
- 텔레메트리·업데이트 확인은 `.claude/settings.json`의 `env`로 끈다. 렌더 후 `feedback` 전송도 하지 않는다.
- `publish`, `cloud`, `lambda`, `cloudrun`, `usage` 등 외부로 나가는 명령은 사용자가 요청할 때만 쓴다.
- 음성·음악·효과음을 기본으로 붙이지 않는다 (첫 제품은 무음 + 자막). `media-use`는 설치하지 않는다.
- 내려받기나 유료 호출이 필요한 옵션(`--on-device` 검색 등)은 사용자 확인 후에만 쓴다.
