# ToDo-Railway

Railway의 Node.js/Express 서비스와 PostgreSQL을 연결해 사용하는 Todo 학습 앱입니다.

## 구조

- `public/index.html`: 브라우저 UI
- `server.js`: Express API + PostgreSQL 연결
- `package.json`: Node.js 실행 및 의존성

브라우저는 PostgreSQL에 직접 접속하지 않고 아래 API를 사용합니다.

- `GET /api/todos`: 목록 조회
- `POST /api/todos`: 할 일 추가
- `PATCH /api/todos/:id`: 완료 상태 변경
- `DELETE /api/todos/:id`: 삭제
- `GET /health`: 서버/DB 연결 확인

## Railway 설정

1. GitHub 저장소의 `feat/sql` 브랜치를 Railway 앱 서비스에 연결합니다.
2. 같은 Railway 프로젝트의 Postgres 서비스와 앱 서비스를 연결합니다.
3. 앱 서비스 Variables에 `DATABASE_URL`을 Postgres의 `DATABASE_URL` 참조 변수로 설정합니다.
4. Railway가 `npm start`를 실행하면 `server.js`가 시작됩니다.
5. 서버 시작 시 아래 `todos` 테이블이 없으면 자동 생성됩니다.

```sql
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  task TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

배포 후 `/health`에서 다음 응답이 나오면 DB 연결이 정상입니다.

```json
{"status":"ok","database":"connected"}
```
