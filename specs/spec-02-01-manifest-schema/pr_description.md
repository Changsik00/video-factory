feat(spec-02-01): add manifest schema, validation and timeline resolution

## 📋 Summary

### 배경 및 목적
ADR-003 은 "하나의 대본에서 HTML 발표·PDF·MP4 를 낸다"고 정했지만 원본이 되어야 할 대본(명세)의 형식과 검증이 없었다. `present` 의 fragment 는 절대 시각이라 슬라이드를 끼우면 값이 틀어지고, 구성 오류는 `check` 가 아니라 `present` 를 띄워야 드러났다. 최소 명세 스키마, 검증, 시각 변환을 만든다 (생성은 다음 spec).

### 주요 변경 사항
- [x] `scripts/lib/manifest.mjs`: `validateManifest(manifest, { exists })` 는 `{ ok, errors: [{path, code, message}] }` 를 돌려주고 예외를 던지지 않는다. 알 수 없는 필드는 오류
- [x] `resolveTimeline(manifest)`: 슬라이드 로컬 `steps` 를 절대 `start`/`end`/`fragments` 와 전체 길이로 변환 (밀리초 반올림, 무효 명세는 예외)
- [x] `catalog/formats/sample-deck/`: 5장 샘플 명세와 생성한 자리표시자 이미지
- [x] `docs/manifest-schema.md`: 필드 규칙, 오류 코드, 시각 변환, `present` 진입 규칙
- [x] `tests/manifest.test.mjs`: 32개 (기존 141개 유지, 총 173개)

### Phase 컨텍스트
- **Phase**: `phase-02` (one-script-three-outputs)
- **본 SPEC 의 역할**: 세 출력이 공유할 단일 원본(대본)의 형식과 검증

## 🎯 Key Review Points

1. **시각 모델**: 명세에는 슬라이드 로컬 시각(`steps`)과 항목별 단계 번호(`step`)만 두고 절대 시각은 도출한다. 슬라이드를 끼워도 값이 안 틀어진다.
2. **`present` 진입 규칙 반영**: fragment 가 있는 슬라이드는 첫 단계 시각에서 진입하므로 `step` 0 항목은 진입 즉시 보인다 (phase-01 실측). "아무것도 안 보이는 상태로 시작"은 표현할 수 없다.
3. **샘플 이미지는 생성한 자리표시자**이며 실제 자산이 아니다.
4. 이 PR 은 명세의 형식과 검증만 다룬다. 덱·PDF·MP4 생성과 `present` 실측은 spec-02-02, 02-03 이다. 스키마는 그 과정에서 바뀔 수 있다.
5. 구현 중 테스트 기대값 2건을 정정했다 (walkthrough 발견 사항 참고).

## 🧪 Verification

### 자동 테스트
```bash
npm test
```
- ✅ 173개 PASS, 0 fail (무효 사례, 시각 변환, 샘플 명세)

### 수동 검증 시나리오
1. 샘플 명세 시각 변환: 총 27초, points fragments 7·10, picture 14, summary 20·22 (손 계산과 일치, 테스트로 고정)
2. 샘플의 `steps` 를 `step` 으로 오타 → `unknown_field` 오류
3. 자리표시자 이미지를 직접 열어 확인 (1280x720)

## 📦 Files Changed
- `scripts/lib/manifest.mjs`, `tests/manifest.test.mjs`
- `catalog/formats/sample-deck/manifest.json`, `catalog/formats/sample-deck/images/placeholder.png`
- `docs/manifest-schema.md`, `specs/spec-02-01-manifest-schema/`, `backlog/`
