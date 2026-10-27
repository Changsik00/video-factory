# 도구 검증 결과 (tool-findings)

Phase 1 실측 기록. 확인한 것만 적고, 하지 않은 것은 "미확인"에 따로 둔다 (`docs/project-principles.md`).

## HyperFrames — 블록 렌더 (spec-01-01, 2026-10-27)

### 환경
| 항목 | 값 |
|---|---|
| OS / CPU | macOS (Darwin 25.6.0), x86_64 |
| GPU | Intel UHD Graphics 630 (Chrome이 `ANGLE Metal Renderer`로 hardware 모드로 인식) |
| Node / FFmpeg | v22.14.0 / 8.1.1 |
| HyperFrames CLI | `hyperframes@0.8.206` (고정) |
| 렌더 품질 | `draft` (looks/delivery는 미확인) |
| 레지스트리 | `raw.githubusercontent.com/heygen-com/hyperframes/main/registry` (**main 브랜치를 실행 시점에 읽음, 고정 아님**) |

### 절차 (재현)
```bash
npm test                                   # 단위 테스트
node scripts/render-blocks.mjs --dry-run   # 후보 15개가 레지스트리에 있는지 확인
node scripts/render-blocks.mjs             # 샌드박스(runs/phase-01/hf-sandbox) 에 설치·렌더·ffprobe·화면 검사
# 변수 교체 렌더
node scripts/render-blocks.mjs --only=<블록> --suffix=-ko --variables='{"키":"값"}'
```
러너는 `HYPERFRAMES_NO_TELEMETRY=1`, `DO_NOT_TRACK=1`, `HYPERFRAMES_SKIP_SKILLS=1`을 설정하고 `add --no-clipboard`를 쓴다.

### 결과 (후보 15개, 전부 렌더 성공)
성공 15 / 부분 0 / 실패 0. 15개 총 렌더 시간 약 7.0분 (블록당 약 12~83초, 2~15초 길이 영상).

| 블록 | 그룹 | 결과 | 길이(초) | 해상도 | 렌더(초) | 화면 검사 |
|---|---|---|---|---|---|---|
| code-highlight | cpu | success | 5.0 | 1920x1080 | 37 | ok |
| data-chart | cpu | success | 15.0 | 1920x1080 | 32 | ok |
| lt-bold-block | cpu | success | 4.8 | 1920x1080 | 21 | ok |
| hw-title | cpu | success | 6.0 | 1920x1080 | 20 | ok |
| editorial-flash-overlay | cpu | success | 4.0 | 1920x1080 | 23 | ok |
| beat-freeze-cut | cpu | success | 6.0 | 1920x1080 | 41 | ok |
| chatgpt-exchange | cpu | success | 14.9 | 1080x1920 | 83 | ok |
| canopy-part-title | cpu | success | 12.0 | 1920x1080 | 46 | ok |
| spain-map | cpu | success | 12.0 | 1920x1080 | 36 | ok |
| color-wheel | webgpu | success | 2.0 | 1920x1080 | 15 | ok |
| aurora | webgpu | success | 2.0 | 1920x1080 | 13 | ok |
| chrome-orb | webgpu | success | 2.0 | 1920x1080 | 13 | ok |
| code-3d-extrude | webgl | success | 8.0 | 1920x1080 | 17 | ok |
| cinematic-zoom | webgl | success | 4.0 | 1920x1080 | 15 | ok |
| camera-dolly-zoom | 3d | success | 4.0 | 1920x1080 | 12 | ok |

- "그룹"은 레지스트리 태그 기준 추정이다. `cpu` 그룹은 webgpu/webgl/shader/3d 태그가 없는 블록.
- 길이·해상도는 ffprobe 값이 레지스트리 메타와 일치(길이 허용오차 0.5초).
- "화면 검사"는 ffmpeg `signalstats`의 최대 밝기와 프레임 간 차이(YDIF)로 빈 화면/정지 화면을 걸러낸 결과다 (기준: 최대 밝기 20 이하=blank, YDIF 최대 0.01 미만=static). 실측 기준: 빈 프로젝트 0.005, 가장 느린 움직임(chrome-orb) 0.05, 일반 블록 0.25 이상.
- 중간 프레임 15장을 직접 확인했다 (`runs/phase-01/posters/sheet.png`, git 제외). 모두 내용이 보이고 깨진 화면은 없었다. 시각 품질 판정은 사용자 확인이 필요하다.

### 한국어 텍스트 변수 (요구사항 4)
| 블록 | 결과 | 렌더(초) | 화면 검사 |
|---|---|---|---|
| canopy-part-title | success | 25 | ok |
| chatgpt-exchange | success | 43 | ok |

- `canopy-part-title`(headline1/2)과 `chatgpt-exchange`(prompt, intro1/2, 표 문구)에서 한국어 글자가 두부(□) 없이 표시되었다 (프레임 확인: `runs/phase-01/posters/ko-canopy.png`, `ko-chat.png`). **사용자 확인 필요.**
- 한국어 폰트는 블록의 기본 폰트(Helvetica, ChatUI)에서 시스템 폰트로 대체되어 나왔다. 대체 폰트가 다른 OS/컨테이너에서도 있는지는 미확인.

### 발견한 문제와 처리
1. **에셋이 있는 블록은 렌더러가 `/assets/...`를 프로젝트 루트에서 찾는다.** `canopy-part-title`은 `compositions/canopy-part-title/assets/`에 설치되지만, 그대로 렌더하면 텍스처 404가 나고 **렌더는 성공(exit 0)하면서 화면은 검은색**이 된다. 에셋을 프로젝트 루트 `assets/`로 복사하면 정상 렌더된다 (러너에 반영). 블록이 여러 개이면 에셋 파일명 충돌 가능성이 있다 (미확인).
2. **"렌더 성공(exit 0) + ffprobe 통과"만으로는 거짓 성공을 걸러내지 못한다.** 위 1번이 그 사례였고, 그래서 화면 검사를 추가했다.
3. **일부 블록은 하위 폴더에 설치된다** (`compositions/<이름>/<이름>.html`). 경로를 `add --json`의 `written`에서 찾아야 한다.
4. **오버레이/자막 계열 블록은 단독으로 렌더하면 흰 배경 위에 나온다** (`lt-bold-block`, `hw-title`, `editorial-flash-overlay`). 쇼케이스에는 배경 장면과의 합성 방식이 필요하다 (spec-01-03에서 확인).
5. **CLI 기본 동작의 부작용:** 텔레메트리 전송 기본 켜짐, `add`가 클립보드에 복사, `init`이 샌드박스에 `AGENTS.md`/`CLAUDE.md` 생성, 스킬 자동 설치 시도. 러너는 앞의 세 가지를 끄고 스킬 설치를 건너뛴다.
6. **변수 메타가 불완전하다.** 레지스트리 `registry-item.json`의 `variables`는 후보 15개 중 14개가 비어 있고(`camera-dolly-zoom`만 문자열이 아닌 변수 4개; 전체 210개 중 문자열 변수가 있는 블록은 22개), 실제 변수는 컴포지션 HTML의 `data-composition-variables`에 선언된 경우가 있다 (후보 중 3개: camera-dolly-zoom, chatgpt-exchange, canopy-part-title). 변수 목록은 설치 후 HTML에서 읽어야 한다.
7. **실제 제품 UI를 흉내 낸 블록이 있다.** `chatgpt-exchange`는 "Ask ChatGPT" 화면과 "Official A.I Ranking" 같은 권위 표시 칩을 기본값으로 포함한다 (`claude-exchange`도 같은 계열로 보임). 쇼케이스에 넣을 때 상표·오인 위험이 있으므로 "모의 화면" 표기 또는 제외 기준이 필요하다.
8. 블록 문서(SKILL.md)가 예전 CLI 버전(0.8.12)을 가리키는 예가 있다. 문서 명령을 그대로 믿지 말고 실측한다.

### 환경 대응 결과 (GPU)
후보 중 webgpu 태그 3개(aurora, chrome-orb, color-wheel), webgl/shader 2개(code-3d-extrude, cinematic-zoom), 3D 1개(camera-dolly-zoom)가 이 Intel Mac에서 모두 정상 렌더되었다. 전체 210개 중 webgpu/webgl 계열 약 57개에 대한 일반화는 하지 못한다 (표본 6개).

### 미확인 (이 spec에서 하지 않은 것)
- 후보 외 195개 블록의 렌더 가능 여부, 에셋 파일명 충돌
- `looks`/`delivery` 품질, 렌더 결정성(같은 입력 2회 렌더 결과가 같은지), `--docker` 렌더
- 병렬 렌더 시 자원 사용 (러너는 블록을 순차 처리)
- 오디오가 필요한 블록(음성 없는 방향이라 제외)
- 시각 품질의 사람 판정, 한국어 표시의 사용자 확인
- `caption-*` 자막 컴포넌트 (spec-01-02), 샘플 영상·라이선스·작성자 정리·Hypit 점검 (spec-01-03)
