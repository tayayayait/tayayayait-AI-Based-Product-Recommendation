# API Contracts (Draft)

의존 중인 엔드포인트와 요청/응답 스키마 초안입니다. `VITE_API_BASE_URL`이 설정되면 `services/api.ts`가 호출합니다.

## 1) 기사 분석 POST `/analysis/article`
- **Request**:  
  - `title` string  
  - `content` string (본문 전체)  
  - `articleId` string  
  - `language` string (예: `ko`)  
- **Response**: `{ matches: Match[] }`  
- **Match**: `{ id, articleId, productId, matchedKeyword, contextSentence, contextScore, isApproved }`  
  - `contextScore` 0-100 정수, `isApproved` 기본 false

## 2) 비디오 분석 POST `/analysis/video`
- **Request**: `{ contentId: string, videoUrl: string }`
- **Response**: `{ markers: VideoMarker[] }`
- **VideoMarker**: `{ id, productId, start, end, position: { x, y }, keyword }`
  - `start/end` 초 단위, `position`은 퍼센트(0-100)

## 3) 매칭 저장 POST `/matches`
- **Request**: `{ articleId: string, matches: Match[] }`
- **Response**: `{ saved: number, matchIds?: string[] }`
- 서버는 승인된 매칭만 저장/업데이트 처리

## 3-1) 매칭 조회 GET `/matches`
- **Query**: `articleId=...`
- **Response**: `{ matches: Match[] }` (승인된 매칭 위주로 반환)

## 4) 상품 목록 GET `/products`
- **Response**: `{ products: Product[] }`
- **Product**: `{ id, name, description, price, imageUrl, linkUrl }`

## 5) 이벤트 수집 POST `/events`
- **Request**: `{ events: Event[] }`
- **Event**: `{ event, sessionId, occurredAt, contentId?, productId?, matchedKeyword?, widgetVersion?, location?, viewable?, cta?, attribution?, metadata? }`
  - `location` `{ timecodeSeconds?, scrollDepthPercent? }`
  - `attribution` `{ utmSource?, utmMedium?, utmCampaign? }`
- **Metadata 기본 필드**: `consent` (`granted|denied|unknown`)가 자동 포함됨
- **Response**: `{ received: number }`

## 공통
- 인증 헤더 예: `Authorization: Bearer <token>` 또는 `x-api-key: <key>`
- 오류: `{ error: string, details?: unknown }` with 4xx/5xx
