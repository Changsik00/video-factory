feat(spec-01-01): add hyperframes block render validation

## 📋 Summary

### 배경 및 목적
첫 제품(이펙트·샘플 쇼케이스)의 소재인 HyperFrames 블록이 실제로 렌더되는지 한 번도 확인된 적이 없었다. 후보 15개를 설치·렌더해 성공 여부, 원인, 시간, 한국어 표시를 실측했다.

### 주요 변경 사항
- [x] 후보 목록 `catalog/validation/blocks.json` (cpu 9 / webgpu 3 / webgl 2 / 3d 1)
- [x] 렌더 러너 `scripts/render-blocks.mjs`: 샌드박스 init → add → 렌더 → ffprobe → 화면 검사
- [x] 결과 분류·요약(`summarize.mjs`), 실패 원인·화면 검사(`diagnose.mjs`) 순수 함수와 단위 테스트
- [x] 실측 결과 `docs/tool-findings.md`: 15/15 성공, 한국어 변수 렌더 2개 성공

### Phase 컨텍스트
- **Phase**: `phase-01` (tool-validation)
- **본 SPEC 의 역할**: 블록 렌더 가능 범위와 한계를 실측해 spec-01-02/03과 이후 카탈로그 설계의 근거를 만든다.

## 🎯 Key Review Points

1. **화면 검사(`diagnose.mjs`)**: exit 0 + ffprobe 통과인데 검은 화면인 사례(`canopy-part-title`)가 있어 추가. 기준값(최대 밝기 20, YDIF 0.01)은 실측 근거가 `docs/tool-findings.md`에 있다.
2. **에셋 복사/경로 해석**: 하위 폴더 블록의 에셋을 프로젝트 루트 `assets/`로 복사한다. 블록이 늘면 파일명 충돌 가능(미확인).
3. **외부 부작용 차단**: 러너가 텔레메트리, 스킬 자동 설치, 클립보드 복사를 끈다. `hyperframes` 버전은 0.8.206 고정(레지스트리는 main을 실행 시점에 읽음).

## 🧪 Verification

### 자동 테스트
```bash
npm test
```

**결과 요약**:
- ✅ 36개 PASS, 0 fail

### 수동 검증 시나리오
1. 15개 블록 전체 렌더 → 성공 15, 화면 검사 전부 ok
2. GPU 태그 블록 6개 → 이 Intel Mac에서 정상 (표본 한계 있음)
3. 한국어 변수 렌더 2개 → 두부 없음, 사용자 확인 완료

## 📦 Files Changed

### 🆕 New Files
- `catalog/validation/blocks.json`: 후보 블록 15개
- `scripts/render-blocks.mjs`, `scripts/lib/summarize.mjs`, `scripts/lib/diagnose.mjs`: 러너와 순수 함수
- `tests/*.test.mjs` 3개: 목록, 요약, 진단 테스트
- `docs/tool-findings.md`: 실측 결과
- `specs/spec-01-01-hyperframes-blocks/`: spec, task, walkthrough, pr_description

### 🛠 Modified Files
- `package.json`: `test` 스크립트, `engines.node >=22`
- `backlog/phase-01.md`, `backlog/queue.md`: spec 등록

**Total**: 약 15 files changed

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-01-hyperframes-blocks/walkthrough.md`
- 결과: `docs/tool-findings.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
