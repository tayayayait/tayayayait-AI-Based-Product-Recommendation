# Widget Host Integration (Draft)

목표: 퍼블리시된 기사/영상 페이지에 JS 스니펫을 삽입해 승인된 매칭을 불러오고, 노출/클릭을 `/events`로 전송하는 흐름입니다.

## 1) 임베드 스니펫 예시
```html
<script src="https://cdn.contextual-commerce.ai/widget.js"
  data-article-id="ART123"
  data-org-id="ORG456"
  async></script>
<div id="cc-widget-container"></div>
```
- `data-article-id`: CMS에서 내려주는 문서 ID
- `data-org-id`: 조직/테넌트 ID

## 2) 매칭 조회 API
- GET `/matches?articleId=ART123`
- Response: `{ matches: Match[] }` (승인된 매칭만 반환 권장)
- 프런트는 `services/api.ts`의 `fetchApprovedMatches(articleId)`를 사용

## 3) 렌더 책임
- 매칭 리스트 → 카드/인라인/비디오 오버레이로 렌더
- 노출 시 `product_impression`, 클릭 시 `product_click`, CTA 시 `add_to_cart` 등 이벤트를 `/events`로 배치 전송
- `metadata`에 `{ consent }`, `attribution`에 UTM 값을 포함 (앱에서 자동 처리)

## 4) 에러/폴백
- API 실패 시: 위젯은 조용히 숨기거나 “상품을 불러올 수 없습니다” 메시지 표시
- 매칭 0건: 위젯을 렌더하지 않음

## 5) 인증/캐싱
- CDN 스크립트는 공개, 데이터 페이로드는 API 키/토큰 필요
- 매칭 응답 캐싱: `Cache-Control`(짧게, 예: 60s) 권장
