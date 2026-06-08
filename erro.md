# erro.md — Nhật ký lỗi & checklist trước khi hoàn thành phase

> **Mục đích:** Ghi lại lỗi đã gặp để không lặp lại. Mỗi phase trong README phải pass checklist tương ứng trước khi chuyển phase tiếp theo.
>
> **Quy tắc:** Khi gặp lỗi mới → thêm vào [Nhật ký lỗi](#-nhật-ký-lỗi-theo-thời-gian). Khi fix xong → ghi **Nguyên nhân** và **Cách tránh**.

---

## Quy trình làm việc (tóm tắt từ README)

1. Đọc README theo thứ tự — **không bỏ phase**.
2. **Không đổi schema DB** — dùng `backup.sql` / `init.sql` có sẵn.
3. Phát triển theo Phase 1 → 8 (xem bảng checklist bên dưới).
4. Trước khi đánh dấu phase xong: chạy **Kiểm tra bắt buộc** của phase đó.
5. Cập nhật file này nếu có lỗi mới.

---

## Kiểm tra chung (mọi phase)

| # | Việc cần làm | Lệnh / cách kiểm tra |
|---|----------------|----------------------|
| 1 | Build không lỗi TypeScript | Backend: `cd backend && npm run build` — Frontend: `cd frontend && npm run build` |
| 2 | Lint (nếu đã cấu hình) | `npm run lint` trong từng package |
| 3 | Không commit secret | Không có `.env` thật trong git; chỉ `.env.example` |
| 4 | Schema DB không bị sửa | So sánh với README / `backup.sql` — không thêm/xóa cột tùy tiện |
| 5 | Ghi lỗi vào đây | Nếu đã từng sai → thêm dòng vào [Nhật ký lỗi](#-nhật-ký-lỗi-theo-thời-gian) |

---

## Checklist theo Phase (trước khi hoàn thành)

### Phase 1 — Khởi tạo dự án

- [x] Cấu trúc: `backend/`, `frontend/`, `docker/`, `docker-compose.yml`
- [x] `docker compose up -d` — service `db` healthy
- [x] Kết nối PostgreSQL OK (`GET /health/db`, port **5433** — xem nhật ký lỗi)
- [x] `init.sql` khớp README (users, todos, tags, enum `user_role`)
- [x] `npm run build` backend + frontend OK

**Lỗi thường gặp (tránh từ đầu):**

| Lỗi | Triệu chứng | Cách tránh |
|-----|-------------|------------|
| DB chưa ready khi start backend | `ECONNREFUSED`, migration fail | `depends_on: db: condition: service_healthy` trong compose |
| Sai đường dẫn `init.sql` | Bảng không tồn tại | Mount đúng `./docker/postgres/init.sql` |
| TypeORM `synchronize: true` trên prod | Mất dữ liệu / schema lệch | Chỉ dùng synchronize dev; prod dùng migration hoặc SQL có sẵn |

---

### Phase 2 — Backend: Auth

- [ ] `POST /auth/register` — password bcrypt, email unique
- [ ] `POST /auth/login` — trả `access_token`, set cookie `refresh_token` **httpOnly**
- [ ] `POST /auth/refresh` — đọc cookie, cấp access mới
- [ ] `POST /auth/logout` — xóa cookie refresh
- [ ] `JwtAuthGuard`, `RolesGuard`, `BanCheckGuard` hoạt động
- [ ] User bị ban → **403** trên mọi route có guard (không chỉ lúc login)
- [ ] CORS: `credentials: true` + `FRONTEND_URL` đúng

**Kiểm tra nhanh:**

```bash
# Register
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@x.com\",\"password\":\"Test123!\"}"

# Login — lưu access_token, kiểm tra Set-Cookie refresh
curl -i -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@x.com\",\"password\":\"Test123!\"}"
```

| Lỗi | Triệu chứng | Cách tránh |
|-----|-------------|------------|
| Refresh token trong localStorage | XSS lấy được token | Chỉ cookie `httpOnly; Secure` (prod); không trả refresh trong body cho client lưu |
| Quên `credentials: true` (CORS) | Cookie không gửi kèm request | Backend CORS + Frontend axios `withCredentials: true` |
| Ban chỉ check lúc login | User banned vẫn gọi API | `BanCheckGuard` global sau JWT trên protected routes |
| JWT secret ngắn / hardcode prod | Bảo mật yếu | Dùng env `JWT_*_SECRET` >= 32 ký tự ở production |

---

### Phase 3 — Backend: Todos

- [ ] CRUD `/todos` — USER chỉ thấy/sửa todo `user_id` của mình
- [ ] `due_date`: null OK; nếu có → **>= hôm nay 00:00:00** (`future-date.pipe.ts`)
- [ ] `PATCH /todos/:id/toggle` hoạt động
- [ ] List có phân trang mặc định `?page=1&limit=10`
- [ ] Filter: status, priority, search, sortBy, order
- [ ] Xóa todo cascade tags; `updated_at` tự cập nhật (`@UpdateDateColumn`)
- [ ] Owner khác user → **403**; không tồn tại → **404**

**Kiểm tra due_date (bắt buộc):**

```bash
# Phải 400 — ngày quá khứ
curl -X POST http://localhost:3000/todos -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"title\":\"x\",\"due_date\":\"2020-01-01\"}"
```

| Lỗi | Triệu chứng | Cách tránh |
|-----|-------------|------------|
| Chỉ validate due_date ở frontend | API vẫn nhận ngày quá khứ | Pipe/DTO validation backend bắt buộc |
| So sánh Date có timezone lệch | Hôm nay bị coi là quá khứ | Chuẩn hóa `setHours(0,0,0,0)` như README |
| USER xem/sửa todo người khác | Lộ dữ liệu | `findOneOrFail(id, userId)` kiểm tra ownership |
| Thiếu phân trang | Load toàn bộ todos | Default `limit=10` trong service/controller |

---

### Phase 4 — Backend: Admin

- [ ] `GET /admin/users` — phân trang + tìm kiếm
- [ ] `PATCH /admin/users/:id/ban` — toggle; **admin không ban chính mình**
- [ ] `DELETE /admin/users/:id` — cascade todos/tags
- [ ] `GET /admin/todos`, `GET /admin/stats`, `GET /admin/stats/users`
- [ ] Route admin có `RolesGuard` + role `ADMIN`

| Lỗi | Triệu chứng | Cách tránh |
|-----|-------------|------------|
| Admin tự ban | Mất quyền quản trị | Check `targetUserId !== currentUser.id` |
| USER gọi được `/admin/*` | 200 thay vì 403 | `@Roles('ADMIN')` + guard trên controller |
| Ban không vô hiệu refresh ngay | User banned vẫn refresh token | Xóa/invalid refresh token khi ban |

---

### Phase 5 — Frontend: Auth

- [ ] MUI v7 theme + `LocalizationProvider` (nếu dùng DatePicker sau)
- [ ] Login / Register pages
- [ ] Zustand `authStore` — **chỉ lưu access token / user**, không lưu refresh
- [ ] Axios interceptor: 401 → gọi `/auth/refresh` → retry; fail → logout
- [ ] `withCredentials: true` trên axios instance

| Lỗi | Triệu chứng | Cách tránh |
|-----|-------------|------------|
| Infinite refresh loop | Treo tab / spam API | Chỉ retry một lần; flag `_retry` trên request |
| Access token hết hạn không refresh | User bị đá liên tục | Interceptor queue request khi đang refresh |

---

### Phase 6 — Frontend: Todo

- [ ] `/todos` — list, filter, search, pagination
- [ ] Form create/edit — `DatePicker` `minDate={dayjs()}`
- [ ] Toggle complete, delete
- [ ] `/dashboard` — stats cá nhân (nếu implement)

| Lỗi | Triệu chứng | Cách tránh |
|-----|-------------|------------|
| DatePicker cho chọn quá khứ | Backend 400 khó hiểu | `minDate` + validate form trước submit |
| Query key React Query không đổi khi filter | UI không cập nhật | Đưa filter params vào `queryKey` |

---

### Phase 7 — Frontend: Admin

- [ ] `/admin/users`, `/admin/todos`, `/admin/dashboard`
- [ ] `AdminRoute` — chặn USER
- [ ] Charts (MUI X Charts) nếu có stats API

| Lỗi | Triệu chứng | Cách tránh |
|-----|-------------|------------|
| Chỉ ẩn menu admin | USER vẫn vào URL được | `AdminRoute` + backend vẫn phải 403 |

---

### Phase 8 — Docker hoàn chỉnh

- [ ] `Dockerfile` + `Dockerfile.prod` (backend, frontend)
- [ ] `docker-compose.prod.yml` + nginx
- [ ] Prod: DB **không** expose 5432 ra ngoài
- [ ] `docker compose -f docker-compose.prod.yml ... up --build` chạy được
- [ ] API qua nginx prefix `/api/` (nếu dùng config README)

| Lỗi | Triệu chứng | Cách tránh |
|-----|-------------|------------|
| `VITE_API_URL` sai lúc build prod | Frontend gọi localhost | Truyền `ARG VITE_API_URL` lúc **build** image frontend |
| Hot reload volume ghi đè node_modules | Module not found trong container | Chỉ mount `src` dev; không mount cả `node_modules` |
| nginx `proxy_pass` thiếu slash | 404 / route lệch | Kiểm tra `location /api/` và trailing slash |

---

## Lỗi nghiêm trọng (CRITICAL) — từ README

Luôn kiểm tra lại trước khi coi dự án “xong”:

1. **`due_date`** — validation **cả backend và frontend**.
2. **Ban check** — mọi request authenticated, không chỉ login.
3. **Admin không ban chính mình**.
4. **Refresh token** — cookie `httpOnly` only.
5. **CORS** — `credentials: true`.
6. **`updated_at`** — `@UpdateDateColumn` trên Todo entity.
7. **Cascade delete** — user → todos → tags (theo schema, không tắt cascade nhầm).
8. **Phân trang mặc định** — list endpoints `page=1&limit=10`.

---

## Nhật ký lỗi theo thời gian

> Ghi mỗi lỗi **thực tế** khi phát triển. Template:

```markdown
### [YYYY-MM-DD] — Mô tả ngắn

- **Phase:** (1–8)
- **Triệu chứng:** ...
- **Nguyên nhân:** ...
- **Cách sửa:** ...
- **Cách tránh lần sau:** ...
- **Trạng thái:** Đã fix / Đang mở
```

### [2026-06-03] — PostgreSQL port 5432 trùng instance local

- **Phase:** 1
- **Triệu chứng:** `password authentication failed for user "postgres"` khi Nest kết nối `localhost:5432`
- **Nguyên nhân:** Máy Windows đã có PostgreSQL khác chiếm port 5432; Docker DB không nhận connection đó
- **Cách sửa:** Map Docker DB `5433:5432`, dùng `DATABASE_URL=...@localhost:5433/todoapp`
- **Cách tránh lần sau:** Luôn dùng port 5433 trong `.env` dev hoặc tắt PG local trước khi `docker compose up`
- **Trạng thái:** Đã fix

### [2026-06-08] — Code review fixes (5-state todo system)

- **Phase:** 3–7
- **Đã sửa:**
  - `init.sql`: thêm `status`, `cancellation_reason`, `TIMESTAMPTZ`; bỏ `completed`
  - Cron overdue: chỉ `in_progress`, chạy mỗi phút (`EVERY_MINUTE`)
  - `GET /todos/stats` — thống kê 5 trạng thái theo user (đặt **trước** `GET :id`)
  - Redux: `fetchTodosAndSummary` dùng `items` + `total`; admin filters refetch
  - `TodosPage` / `DashboardPage`: summary từ API, không đếm theo trang
  - `performTodoAction`: `PATCH` đúng URL, refetch giữ page/limit
- **Lưu ý:** Sau khi đổi route backend, `docker compose restart backend` nếu `/todos/stats` trả 400
- **Trạng thái:** Đã fix + smoke test OK

---

## Trạng thái dự án (cập nhật lần cuối: 2026-06-08)

| Hạng mục | Trạng thái |
|----------|------------|
| Backend | Auth + Todos 5-state + Admin stats + cron overdue |
| Frontend | TodosPage, Dashboard, AdminDashboard + Redux |
| Docker | `db:5433`, `backend:3000`, `frontend:5174` |
| Build | Backend + frontend **OK** |
| Smoke test | start → complete → cancel → stats **OK** |

**Chạy local:** `docker compose up --build` — frontend tại http://localhost:5174

---

## Tham chiếu nhanh

- Spec đầy đủ: [README.md](./README.md)
- Thứ tự phase: README → mục **「Thứ tự phát triển (cho Cursor)」**
- Tài khoản test sau restore DB: `quan@kontum.com` (USER); promote ADMIN bằng SQL trong README
