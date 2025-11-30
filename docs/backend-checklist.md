# Backend Verification Checklist

목표: API 베이스 URL을 설정한 뒤 주요 엔드포인트를 프런트에서 점검하는 절차입니다.

## 준비
- `.env.local`에 `VITE_API_BASE_URL` 설정 (예: `https://api.example.com`)
- 앱 실행: `npm run dev` (WSL2 권장)
- 화면 우하단 `Dev` 버튼 열기

## 1) 카탈로그(API /products)
- DevTray → `API 핑` 클릭
- 기대: “연결 성공 (api), 상품 N개” 메시지
- 실패 시: 백엔드 로그 확인, CORS/인증 헤더 점검

## 2) 매칭 조회(API /matches)
- 위젯 화면에서 승인 매칭이 비어 있으면 자동으로 `/matches?articleId=demo_article` 호출
- 필요 시 `services/api.ts`의 `fetchApprovedMatches`를 다른 문서 ID로 호출하도록 수정

## 3) 이벤트 수집(API /events)
- DevTray → `이벤트 테스트` 클릭
- 기대: 전송 성공 메시지, 서버에서 이벤트 1건 수신
- 이벤트 페이로드: `event: "page_view"`, `contentId: "devtray_ping"`, `metadata.consent`

## 4) AI/분석 엔드포인트
- Article Analyzer/Video 컴포넌트는 `VITE_API_BASE_URL`이 설정되어 있으면 `/analysis/article`, `/analysis/video`를 호출
- 서버에서 LLM/영상 인식 결과(매칭/마커)를 계산해 반환하도록 구현

## 5) 상품 CRUD
- ProductCatalog의 추가/삭제는 API가 존재할 때 `POST /products`, `DELETE /products/:id` 호출
- 실패 시 UI에서 롤백되므로, 서버 응답/에러 메시지를 확인해 API 스펙에 맞춰 조정

## 6) 배포 전 점검
- `npm run build` 실행 (WSL2/리눅스 환경 권장)
- `.env.local`은 민감 정보가 있으므로 커밋 금지
