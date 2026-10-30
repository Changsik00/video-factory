docs(spec-01-04): verify deck present, render and pdf from one composition

## 📋 Summary

### 배경 및 목적
ADR-003/004 는 "하나의 대본에서 HTML(발표)·PDF·MP4" 를 결정했지만 핵심은 미검증 가설이었다. `slideshow` 스킬 문서에는 "덱을 MP4 로 렌더하지 마라"는 경고까지 있어, 3장짜리 덱 하나로 세 출력을 실제로 만들어 가설을 시험하고 ADR 을 수정한다. 코드 추가는 없고 문서, 스킬 설치, 실측 기록이다.

### 주요 변경 사항
- [x] phase-01 에 추가 목표와 성공 기준 7~9, spec-1-04 요약
- [x] `slideshow` 스킬을 `.claude/skills/slideshow/` 에 추가 (파일 SHA-256 은 `docs/project-principles.md` 에 기록, `skills-lock.json` 은 변경 없음)
- [x] `docs/tool-findings.md`: `present` 진행, 덱 렌더, 덱 PDF, YouTube 업로드 제약
- [x] ADR-003 결정 2 와 PDF 방법을 실측에 맞게 수정, ADR-004 에 조사 결과 반영, 기획 문서 갱신

### Phase 컨텍스트
- **Phase**: `phase-01` (tool-validation)
- **본 SPEC 의 역할**: 다중 형식 출력 구조의 핵심 가설을 실측한다.

## 🎯 Key Review Points

1. **ADR-003 결정 2 수정**: "같은 HTML 그대로" 는 틀렸고 "루트 + 장면 파일 구조에서 present 와 render 가 같은 파일을 쓰고, PDF 는 같은 장면 파일에서 인쇄용 페이지를 생성" 으로 바꿨다. 루트 없이 장면을 한 파일에 두면 `render` 가 첫 장면(4초)만 남기는 문서의 경고는 재현됐다.
2. **범위가 좁다**: 글자·색만 있는 3장 덱 1개, 각 방식 1회씩이다. 이미지·영상·3D 장면, 분기 슬라이드, 소리, 전환 애니메이션, 청중 동기화는 확인하지 못했다.
3. **사용자 판정 미수령**: 브라우저에서 사람이 직접 눌러 본 확인은 없고, 헤드리스 Chrome 의 실제 키 입력과 스크린샷으로 확인했다.
4. **스킬 설치 부작용**: `skills update slideshow` 가 이름을 지정해도 홈 디렉터리에 4개를 설치했다. `media-use` 는 프로젝트 원칙 위반이라 삭제했고 홈 설치분은 모두 지운 뒤 `slideshow` 만 프로젝트로 복사했다. `HYPERFRAMES_SKIP_SKILLS=1` 은 그대로이며 `skills-lock.json` 은 `computedHash` 계산법을 몰라 바꾸지 않았다.
5. **재현성**: 인쇄용 페이지 생성기와 CDP 구동 스크립트는 scratchpad 에만 있어 저장소로 재현할 수 없다 (이월).
6. **YouTube 규칙은 결론을 못 냈다**: 공식 문서끼리 "미검증 프로젝트 비공개 제한" 규칙이 충돌한다. 업로드는 하지 않았다.

## 🧪 Verification

### 자동 테스트
```bash
npm test
```
- ✅ 141개 PASS, 0 fail (이 spec 은 코드를 추가하지 않음)

### 수동 검증 시나리오
1. `present` + CDP 키 입력 → 슬라이드·fragment 진행과 되돌리기 확인 (스크린샷)
2. `render` 루트 없음 4.0초 / 루트 있음 16.0초, 프레임 5장 확인
3. PDF 이미지 3쪽(글자 0자) / 인쇄 3쪽 벡터(글자 231자)

## 📦 Files Changed
- `docs/tool-findings.md`, `docs/decisions/ADR-003-*.md`, `ADR-004-*.md`, `docs/plan/multi-format-presentation-plan.md`, `docs/project-principles.md`
- `.claude/skills/slideshow/` (스킬 추가), `backlog/`, `specs/spec-01-04-deck-three-outputs/`
