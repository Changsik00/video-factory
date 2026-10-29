feat(spec-01-03): add caption gallery matrix and reel

## 📋 Summary

### 배경 및 목적
spec-01-02 는 스타일 5개 × 배경 3개만 봤다. 사용자 지적("다양한 영상에서 다양한 자막 이펙트를 봐야 한다")에 따라 레지스트리 자막 컴포넌트 16개 × 배경 5개를 렌더해 어떤 조합이 읽히는지 실측하고 모아 볼 수 있는 산출물을 만들었다.

### 주요 변경 사항
- [x] 호스트 확장: 스타일 라벨, scrim, 2초 배경 이어 붙이기 (`scripts/lib/captions-inject.mjs`)
- [x] `W`/`BLOCKS` 구조 컴포넌트 치환 지원 (16개 전부 치환)
- [x] 배경 5개 선정 (`catalog/validation/backdrops.json`)
- [x] 렌더 러너 매트릭스 모드: `--backdrops`, `--scrim`, `--only`, `--force`, 조합별 즉시 저장·재개
- [x] 러너 결함 수정: `check` 결과를 조합 범위로 한정, 자막 스크립트 오류 감지, 2초 배경 검은 화면 거짓 success 방지
- [x] 모음 영상 빌더 `scripts/build-reel.mjs` (대표 조합 선택, `ffprobe` 검사, 프레임 시트)
- [x] 실측 결과 `docs/tool-findings.md`

### Phase 컨텍스트
- **Phase**: `phase-01` (tool-validation)
- **본 SPEC 의 역할**: 자막 이펙트 16개를 여러 배경에서 실측하고 쇼케이스 선택의 근거를 남긴다.

## 🎯 Key Review Points

1. **80조합 중 75개 성공, 실패 5건은 모두 `emoji-pop`.** 같은 `page.goto` 에서 60초 timeout 이 반복되며 화질·PC 부하와 무관하다. 원인은 미확인이고 재시도하지 않았다.
2. **가독성 판정은 프레임 한 장(3.8초) 기준의 에이전트 판단이다.** 영상 전체 재생은 하지 않았고 **사용자 판정은 미수령**이다. 모음 영상 제외 목록도 이 판단에 따른다.
3. **러너 거짓 성공 수정**: 1차 전체 실행(약 70분)은 무효였다 (`check` 오염 72건, 스크립트 오류가 success 처리). 수정 후 재실행했고 1차는 `captions-matrix.v1-contaminated.json` 로만 남겼다.
4. 산출물(`runs/`, 영상, 프레임 시트)은 git 제외이며 업로드하지 않았다.

## 🧪 Verification

### 자동 테스트
```bash
npm test
```

**결과 요약**:
- ✅ 141개 PASS, 0 fail (스펙 시작 시 75개)

### 수동 검증 시나리오
1. 80조합 렌더 → 75 success, `emoji-pop` 5건 실패, 나머지 15개 스타일 `check` 통과
2. 묻힌 8조합에 scrim → clip-wipe·gradient-fill·weight-shift 개선, texture 효과 없음
3. 모음 영상 → 24클립 192초 1920x1080 h264, `ffprobe` 통과, 프레임 시트 확인

## 📦 Files Changed
- `scripts/`: `render-captions.mjs`, `build-reel.mjs`, `lib/{captions-inject,diagnose,matrix,reel}.mjs`
- `tests/`: `captions-inject`, `diagnose`, `matrix`, `reel`, `backdrops-list`
- `catalog/validation/`: `backdrops.json`, `caption-styles.json`
- `docs/tool-findings.md`, `specs/spec-01-03-caption-gallery/`
