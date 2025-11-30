<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1JZ8cB3mm5aIq9zSFDFFeMk93m-PmbNjb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `OPENAI_API_KEY` in [.env.local](.env.local) to your ChatGPT (OpenAI) API key
   - Optional: `GOOGLE_VIDEO_INTELLIGENCE_API_KEY` for 영상 분석.
   - When deploying to Netlify, also define:
     - `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` – backend proxy (Netlify Function)에서 네이버 쇼핑 API를 호출하기 위해 필요
     - `CORS_ALLOW_ORIGIN` (선택) – 허용할 출처, 기본 `*`
     - `VITE_API_BASE_URL = /.netlify/functions/proxy` – 프론트가 Netlify Function을 호출하도록 설정
     - `OPENAI_API_KEY`도 서버 사이드에서 쓰려면 Netlify에 다시 등록해 두세요.
3. Run the app:
   `npm run dev`

## Netlify 배포 (프론트+백엔드)

1. `netlify.toml`은 `netlify/functions/proxy.js`를 함수로 등록하도록 설정되어 있어 별도 백엔드 없이도 `/products`, `/analysis/article` 등 API 요청을 처리합니다.
2. Netlify 환경변수에 위에서 언급한 키들과 `VITE_API_BASE_URL=/.netlify/functions/proxy`를 입력한 후, Deploys → Options → Trigger deploy로 재배포하세요.
3. `netlify dev`를 쓰면 로컬에서 함수가 같이 실행되므로 동일한 환경변수가 필요합니다.

추가 문서:
- API 계약: `docs/api-contracts.md`
- 백엔드 점검 플로우: `docs/backend-checklist.md`
- 위젯 호스팅 플로우: `docs/widget-host.md`
