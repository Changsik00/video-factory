// 대본(콘텐츠 명세) 검증. 외부 도구를 호출하지 않는 순수 함수만 둔다. 스키마는 docs/manifest-schema.md.
// 오류는 예외가 아니라 [{ path, code, message }] 로 모아서 돌려준다 (생성기와 에이전트가 그대로 쓸 수 있게).

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOP_FIELDS = ['title', 'lang', 'slides'];
const SLIDE_FIELDS = ['id', 'duration', 'heading', 'subheading', 'items', 'image', 'steps', 'notes'];
const ITEM_FIELDS = ['text', 'step'];
const IMAGE_FIELDS = ['src', 'alt'];

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const at = (base, key) => (base ? `${base}.${key}` : key);

function unknownFields(obj, allowed, base, add) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) add(at(base, key), 'unknown_field', `알 수 없는 필드: ${key}`);
  }
}

function checkItems(items, steps, base, add) {
  if (!Array.isArray(items)) return add(base, 'items_invalid', 'items 는 배열이어야 합니다');
  items.forEach((item, i) => {
    const p = `${base}[${i}]`;
    if (typeof item === 'string') {
      if (!isText(item)) add(p, 'item_text_missing', '항목 문구가 비어 있습니다');
      return;
    }
    if (!isObject(item)) return add(p, 'item_invalid', '항목은 문자열 또는 {text, step} 이어야 합니다');
    unknownFields(item, ITEM_FIELDS, p, add);
    if (!isText(item.text)) add(`${p}.text`, 'item_text_missing', '항목 text 가 비어 있습니다');
    if (item.step === undefined) return;
    if (!Number.isInteger(item.step)) return add(`${p}.step`, 'item_step_invalid', 'step 은 정수여야 합니다');
    if (steps.length === 0) return add(`${p}.step`, 'item_step_without_steps', 'steps 가 없는 슬라이드에서 step 을 쓸 수 없습니다');
    if (item.step < 0 || item.step >= steps.length) add(`${p}.step`, 'item_step_out_of_range', `step 은 0 이상 ${steps.length - 1} 이하여야 합니다`);
  });
}

function checkSteps(steps, duration, base, add) {
  if (!Array.isArray(steps)) return add(base, 'steps_invalid', 'steps 는 숫자 배열이어야 합니다');
  let prev = null;
  steps.forEach((t, i) => {
    const p = `${base}[${i}]`;
    if (!isNumber(t)) return add(p, 'steps_invalid', 'steps 원소는 숫자여야 합니다');
    if (t <= 0 || (isNumber(duration) && duration > 0 && t > duration)) add(p, 'step_out_of_range', 'steps 값은 0 초과 duration 이하여야 합니다');
    if (prev !== null && t <= prev) add(p, 'steps_not_increasing', 'steps 는 순증가여야 합니다');
    prev = t;
  });
}

function checkImage(image, base, add, exists) {
  if (!isObject(image)) return add(base, 'image_invalid', 'image 는 {src, alt} 객체여야 합니다');
  unknownFields(image, IMAGE_FIELDS, base, add);
  if (!isText(image.src)) add(`${base}.src`, 'image_invalid', 'image.src 는 비어 있지 않은 문자열이어야 합니다');
  else if (typeof exists === 'function' && !exists(image.src)) add(`${base}.src`, 'image_missing_file', `이미지 파일이 없습니다: ${image.src}`);
  if (image.alt !== undefined && typeof image.alt !== 'string') add(`${base}.alt`, 'invalid_type', 'image.alt 는 문자열이어야 합니다');
}

// manifest: 명세 객체, exists(path): 이미지 파일 존재 확인 함수 (생략하면 확인하지 않는다)
export function validateManifest(manifest, { exists } = {}) {
  const errors = [];
  const add = (path, code, message) => errors.push({ path, code, message });

  if (!isObject(manifest)) {
    add('', 'manifest_not_object', '명세는 객체여야 합니다');
    return { ok: false, errors };
  }
  unknownFields(manifest, TOP_FIELDS, '', add);
  for (const key of ['title', 'lang']) {
    if (manifest[key] !== undefined && typeof manifest[key] !== 'string') add(key, 'invalid_type', `${key} 는 문자열이어야 합니다`);
  }

  const slides = manifest.slides;
  if (slides !== undefined && !Array.isArray(slides)) add('slides', 'slides_not_array', 'slides 는 배열이어야 합니다');
  else if (slides === undefined || slides.length === 0) add('slides', 'slides_empty', '슬라이드가 1개 이상 필요합니다');
  else {
    const seen = new Set();
    slides.forEach((s, i) => {
      const base = `slides[${i}]`;
      if (!isObject(s)) return add(base, 'slide_not_object', '슬라이드는 객체여야 합니다');
      if (typeof s.id !== 'string' || !ID_PATTERN.test(s.id)) add(`${base}.id`, 'id_invalid', 'id 는 소문자·숫자·하이픈만 쓸 수 있습니다');
      else if (seen.has(s.id)) add(`${base}.id`, 'id_duplicate', `id 가 중복됩니다: ${s.id}`);
      else seen.add(s.id);
      if (!isNumber(s.duration) || s.duration <= 0) add(`${base}.duration`, 'duration_invalid', 'duration 은 0 초과 숫자여야 합니다');
      if (!isText(s.heading)) add(`${base}.heading`, 'heading_missing', 'heading 이 필요합니다');
      for (const key of ['subheading', 'notes']) {
        if (s[key] !== undefined && typeof s[key] !== 'string') add(`${base}.${key}`, 'invalid_type', `${key} 는 문자열이어야 합니다`);
      }
      const steps = Array.isArray(s.steps) ? s.steps : [];
      if (s.steps !== undefined) checkSteps(s.steps, s.duration, `${base}.steps`, add);
      if (s.items !== undefined) checkItems(s.items, steps, `${base}.items`, add);
      if (s.image !== undefined) checkImage(s.image, `${base}.image`, add, exists);
      unknownFields(s, SLIDE_FIELDS, base, add);
    });
  }
  return { ok: errors.length === 0, errors };
}
