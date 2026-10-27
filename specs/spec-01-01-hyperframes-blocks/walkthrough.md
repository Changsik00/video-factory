# Walkthrough: spec-01-01

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 렌더 성공 판정 | exit 0 + ffprobe / 화면 검사 추가 | 화면 검사 추가 | `canopy-part-title`이 exit 0, ffprobe 통과인데 12초 내내 검은 화면이었음 |
| 정지 화면 기준 | YAVG 범위 / YDIF 최대값 | YDIF 최대 0.01 미만 = static | 최초 기준(YAVG 범위)이 `chrome-orb`를 잘못 static 판정. 실측: 빈 프로젝트 0.005, chrome-orb 0.05, 일반 블록 0.25 이상 |
| 하위 폴더 블록 경로 | 고정 경로 / `add --json`의 `written` | `written`에서 찾음 | 일부 블록이 `compositions/<이름>/<이름>.html`에 설치됨 |
| 에셋 경로 | 그대로 / 루트 `assets/`로 복사 | 복사 | 렌더러가 `/assets/...`를 프로젝트 루트에서 찾음 (가설 후 실측으로 확인) |
| 재시도 | 항상 / 타임아웃만 1회 | 타임아웃만 1회 | 결정적 실패를 반복하지 않는다 (project-principles) |
| `color-wheel` 그룹 | cpu / webgpu | webgpu | 조사 시 webgpu 태그 확인, spec과 테스트 수정 |
| CLI 부작용 | 기본값 / 끔 | 텔레메트리·클립보드·스킬 설치 끔 | 외부 전송과 사용자 클립보드 덮어쓰기 방지 |

## 💬 사용자 협의

- **주제**: 첫 spec의 범위와 기본값
  - **합의**: 영상 위주, 한국어 자막, 작성자 크레딧은 설명란, 실행되지 않는 GPU 블록은 제외하고 기록 (추천값으로 시작)
- **주제**: 렌더 결과 확인
  - **합의**: 사용자가 포스터 시트와 한국어 프레임을 확인한 뒤 "좋아"라고 응답. 세부 화질 판정 의견은 별도로 받지 않았다.

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `npm test`
- **결과**: ✅ Passed (36개 PASS, 0 fail)

### 수동 검증
1. **Action**: `node scripts/render-blocks.mjs` (15개 블록, draft)
   - **Result**: 성공 15 / 부분 0 / 실패 0. 블록당 12~83초, 합계 약 7분. 화면 검사 전부 ok.
2. **Action**: GPU 태그 블록 6개(webgpu 3, webgl 2, 3d 1) 렌더
   - **Result**: 이 Intel UHD 630 Mac에서 모두 정상 화면. 표본 6개라 전체 ~57개로 일반화하지 않는다.
3. **Action**: `--variables`로 한국어 교체 렌더 (`canopy-part-title`, `chatgpt-exchange`)
   - **Result**: 두부(□) 없이 표시. 대체 폰트가 다른 OS에도 있는지는 미확인.

## 🔍 발견 사항

- exit 0 + ffprobe 통과는 거짓 성공을 못 걸러낸다 (검은 화면 사례).
- 레지스트리 `variables` 메타가 대부분 비어 있어 변수 목록은 설치 후 HTML의 `data-composition-variables`에서 읽어야 한다.
- 오버레이 블록은 단독 렌더 시 흰 배경이라 쇼케이스에는 배경 합성이 필요하다.
- `chatgpt-exchange`는 실제 제품 UI를 흉내 낸다. 쇼케이스 사용 시 "모의 화면" 표기 또는 제외 기준이 필요하다.
- harness-kit 상류 버그: `.harness-kit/hooks/check-secrets.sh` 가 자기 주석/메시지 텍스트에 걸려 커밋이 막힌다. 해당 두 줄의 문구를 바꿔서 우회 없이 통과시켰다. 상류 리포팅은 아직 안 했다.

## 🚧 이월 항목

- 오버레이 배경 합성, 브랜드 모방 블록 처리 기준 → spec-01-03
- 자막 컴포넌트 시험 → spec-01-02
- 후보 외 195개 블록, looks/delivery 품질, 렌더 결정성, 에셋 파일명 충돌 → phase-03 이후
- `check-secrets.sh` 자기 매칭 이슈를 harness-kit에 리포트 (`/hk-report-issue`)
