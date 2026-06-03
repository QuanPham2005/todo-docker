# 📝 Todo App — Full Stack (NestJS + MUI v7 + PostgreSQL + Docker)

> **Dành cho Cursor AI:** Đọc từng phần theo thứ tự. Mỗi phase có checklist rõ ràng. Không bỏ qua bước nào.

---

## 📐 Tổng quan kiến trúc

```
todo-app/
├── backend/          # NestJS REST API
├── frontend/         # React + Material UI v7
├── docker/           # Cấu hình Docker
│   ├── nginx/
│   └── postgres/
├── docker-compose.yml          # Local dev
├── docker-compose.prod.yml     # Production
└── README.md
```

### Stack
| Layer | Công nghệ |
|---|---|
| Backend | NestJS (TypeScript), TypeORM |
| Frontend | React 18, Material UI v7, React Query |
| Database | PostgreSQL 17 |
| Auth | JWT (Access Token + Refresh Token) |
| Container | Docker + Docker Compose |
| Reverse Proxy (prod) | Nginx |

---

## 🗄️ Database Schema

> Schema đã có sẵn từ `backup.sql`. Giữ nguyên, KHÔNG thay đổi cấu trúc bảng.

```sql
-- Enum phân quyền
CREATE TYPE public.user_role AS ENUM ('USER', 'ADMIN');

-- Bảng người dùng
CREATE TABLE public.users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          user_role DEFAULT 'USER' NOT NULL,
    is_banned     BOOLEAN DEFAULT false NOT NULL,
    created_at    TIMESTAMP DEFAULT now() NOT NULL
);

-- Bảng công việc
CREATE TABLE public.todos (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    due_date    TIMESTAMP,           -- Chỉ cho phép >= ngày hôm nay
    priority    TEXT DEFAULT 'Low' NOT NULL,  -- 'Low' | 'Medium' | 'High'
    completed   BOOLEAN DEFAULT false NOT NULL,
    created_at  TIMESTAMP DEFAULT now() NOT NULL,
    updated_at  TIMESTAMP DEFAULT now() NOT NULL
);

-- Bảng tag (nhiều tag cho 1 todo)
CREATE TABLE public.tags (
    id         SERIAL PRIMARY KEY,
    todo_id    INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);
```

---

## 👤 Phân tích tính năng theo Role

### Role: USER (Người dùng)

#### ✅ Xác thực
- [ ] Đăng ký tài khoản (email + password)
- [ ] Đăng nhập → nhận JWT access token + refresh token (cookie httpOnly)
- [ ] Đăng xuất (xoá refresh token)
- [ ] Tự động làm mới access token (silent refresh)

#### ✅ Quản lý Todo
- [ ] **Tạo todo** — bắt buộc: `title`; tuỳ chọn: `description`, `due_date`, `priority`, `tags[]`
- [ ] **Ràng buộc `due_date`** — validation ở cả backend và frontend:
  - Nếu có `due_date` → phải >= ngày hôm nay (00:00:00 giờ local)
  - Không cho phép chọn ngày quá khứ
  - Cho phép để trống `due_date` (null)
- [ ] **Xem danh sách todo** — chỉ thấy todo của chính mình
- [ ] **Lọc & sắp xếp** todo theo:
  - Trạng thái: tất cả / chưa hoàn thành / đã hoàn thành
  - Mức độ ưu tiên: Low / Medium / High
  - Hạn chót: sắp đến trước / xa nhất
  - Tìm kiếm theo tiêu đề
- [ ] **Sửa todo** — sửa title, description, due_date, priority, tags
- [ ] **Đánh dấu hoàn thành / chưa hoàn thành** (toggle `completed`)
- [ ] **Xoá todo** — xoá mềm hoặc xoá thật (cascade xoá tags)
- [ ] **Quản lý tag** — thêm / xoá tag khi tạo hoặc sửa todo

#### ✅ Tính năng mở rộng đề xuất (USER)
- [ ] **Dashboard cá nhân** — hiển thị thống kê của bản thân:
  - Tổng số todo
  - Số đã hoàn thành / chưa hoàn thành
  - Số todo quá hạn (due_date < hôm nay và chưa hoàn thành)
  - Biểu đồ hoàn thành theo tuần (MUI Charts)
- [ ] **Bộ lọc nâng cao** — lọc kết hợp nhiều điều kiện
- [ ] **Phân trang** — tránh tải quá nhiều dữ liệu cùng lúc
- [ ] **Thông báo hạn chót** — badge cảnh báo todo sắp hết hạn (trong 24h)
- [ ] **Sắp xếp kéo thả** (drag & drop) thứ tự ưu tiên hiển thị

---

### Role: ADMIN (Quản trị viên)

#### ✅ Quản lý người dùng
- [ ] **Xem danh sách tất cả người dùng** (có phân trang, tìm kiếm)
- [ ] **Xem chi tiết người dùng** — email, ngày tạo, trạng thái ban, số lượng todo
- [ ] **Ban / Unban người dùng** — toggle `is_banned`
  - Người dùng bị ban sẽ nhận lỗi 403 khi gọi API
  - Refresh token của người bị ban bị vô hiệu hoá ngay lập tức
- [ ] **Xoá người dùng** — cascade xoá toàn bộ todos và tags của họ

#### ✅ Quản lý Todo (toàn bộ hệ thống)
- [ ] **Xem tất cả todo** của tất cả người dùng
- [ ] **Sửa bất kỳ todo** nào
- [ ] **Xoá bất kỳ todo** nào

#### ✅ Thống kê & Báo cáo
- [ ] **Tổng quan hệ thống:**
  - Tổng số người dùng
  - Tổng todo toàn hệ thống
  - Số todo hoàn thành / chưa hoàn thành
  - Số todo quá hạn
- [ ] **Thống kê theo người dùng:**
  - Số todo đã tạo
  - Số todo đã hoàn thành
  - Số todo chưa hoàn thành
  - Tỷ lệ hoàn thành (%)
- [ ] **Biểu đồ trực quan** (MUI X Charts):
  - Bar chart: todo hoàn thành vs chưa hoàn thành theo từng user
  - Line chart: todo được tạo theo thời gian (ngày/tuần/tháng)
  - Pie chart: phân bố priority (Low / Medium / High)

---

## 🔐 Luồng xác thực (Auth Flow)

```
Client                          Backend
  |                               |
  |-- POST /auth/register ------->|  Tạo user, hash password (bcrypt)
  |<-- 201 Created ---------------|
  |                               |
  |-- POST /auth/login ---------->|  Kiểm tra email + password
  |<-- 200 { access_token } ------|  Set refresh_token cookie (httpOnly)
  |                               |
  |-- GET /todos (Bearer token) ->|  Guard kiểm tra JWT + is_banned
  |<-- 200 [...] -----------------|
  |                               |
  |-- POST /auth/refresh -------->|  Đọc cookie refresh_token
  |<-- 200 { access_token } ------|  Cấp access_token mới
  |                               |
  |-- POST /auth/logout --------->|  Xoá cookie refresh_token
  |<-- 200 OK --------------------|
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Mô tả | Guard |
|---|---|---|---|
| POST | `/auth/register` | Đăng ký | Public |
| POST | `/auth/login` | Đăng nhập | Public |
| POST | `/auth/logout` | Đăng xuất | JWT |
| POST | `/auth/refresh` | Làm mới token | Cookie |

### Todos (USER)
| Method | Endpoint | Mô tả | Guard |
|---|---|---|---|
| GET | `/todos` | Lấy danh sách todo của mình | JWT |
| POST | `/todos` | Tạo todo mới | JWT |
| GET | `/todos/:id` | Xem chi tiết 1 todo | JWT + Owner |
| PATCH | `/todos/:id` | Sửa todo | JWT + Owner |
| DELETE | `/todos/:id` | Xoá todo | JWT + Owner |
| PATCH | `/todos/:id/toggle` | Toggle hoàn thành | JWT + Owner |

### Admin
| Method | Endpoint | Mô tả | Guard |
|---|---|---|---|
| GET | `/admin/users` | Danh sách người dùng | JWT + Admin |
| PATCH | `/admin/users/:id/ban` | Ban/Unban user | JWT + Admin |
| DELETE | `/admin/users/:id` | Xoá user | JWT + Admin |
| GET | `/admin/todos` | Tất cả todos hệ thống | JWT + Admin |
| DELETE | `/admin/todos/:id` | Xoá bất kỳ todo | JWT + Admin |
| GET | `/admin/stats` | Thống kê tổng quan | JWT + Admin |
| GET | `/admin/stats/users` | Thống kê theo từng user | JWT + Admin |

---

## 🚀 Phase 2 — Mở rộng & Hoàn thiện
Trong Phase 2, tập trung hoàn thiện trải nghiệm người dùng, mở rộng quản trị, tối ưu production và bổ sung kiểm thử.

### 🔧 Mục tiêu chính
- [ ] Hoàn thiện dashboard USER với thống kê cá nhân, badge todo sắp hết hạn, và biểu đồ hoàn thành.
- [ ] Thêm phân trang/limit cho API `GET /todos`, `GET /admin/users`, `GET /admin/todos`.
- [ ] Tối ưu UI/UX responsive cho mobile và desktop.
- [ ] Mở rộng bộ lọc todo: nhiều điều kiện kết hợp, tìm kiếm nâng cao, sắp xếp theo ngày tạo và priority.
- [ ] Bổ sung quản lý tag trên frontend: thêm / xoá tag khi sửa todo.

### 🧩 Tính năng bổ sung (Phase 2)
- [ ] Đổi trạng thái todo nhanh (toggle hoàn thành) ngay trong danh sách.
- [ ] Hiển thị danh sách todo quá hạn và todo sắp đến hạn.
- [ ] Cảnh báo “due date” quá gần trong giao diện danh sách.
- [ ] Giao diện chi tiết người dùng cho ADMIN với số lượng todo và trạng thái ban.
- [ ] Cho ADMIN xem thống kê theo user, ưu tiên, trạng thái hoàn thành.
- [ ] Xây dựng các biểu đồ trực quan bằng MUI X Charts trong trang Admin.

### 🧪 Kiểm thử và ổn định
- [ ] Viết unit test cho service/backend validation quan trọng (auth, todos, admin).
- [ ] Viết e2e test cho luồng đăng nhập, tạo/sửa/xoá todo và refresh token.
- [ ] Kiểm tra validation `due_date` trên cả backend và frontend.
- [ ] Bổ sung xử lý lỗi chung bằng filter `HttpExceptionFilter`.

### 🛳️ Production & Deployment
- [ ] Hoàn thiện `docker-compose.prod.yml` và cấu hình Nginx reverse proxy.
- [ ] Định nghĩa biến môi trường rõ ràng cho backend và frontend.
- [ ] Đảm bảo build Docker image chạy được cả backend và frontend.
- [ ] Thêm README hướng dẫn deploy production và chạy local dev.

### 📌 Ghi chú thêm
Phase 2 hướng đến một ứng dụng Todo hoàn chỉnh, thân thiện với người dùng, dễ bảo trì và sẵn sàng deploy thực tế.

### Query Params cho GET /todos
```
?page=1&limit=10
&status=all|completed|incomplete
&priority=Low|Medium|High
&search=keyword
&sortBy=due_date|created_at|priority
&order=ASC|DESC
```

---

## 📁 Cấu trúc thư mục chi tiết

### Backend (NestJS)
```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── refresh.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── ban-check.guard.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       └── login.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   │
│   ├── todos/
│   │   ├── todos.module.ts
│   │   ├── todos.controller.ts
│   │   ├── todos.service.ts
│   │   ├── entities/
│   │   │   ├── todo.entity.ts
│   │   │   └── tag.entity.ts
│   │   └── dto/
│   │       ├── create-todo.dto.ts
│   │       ├── update-todo.dto.ts
│   │       └── query-todo.dto.ts
│   │
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts
│   │   └── admin.service.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── pipes/
│   │       └── future-date.pipe.ts   ← Validate due_date >= hôm nay
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── .env.example
├── Dockerfile
└── package.json
```

### Frontend (React + MUI v7)
```
frontend/
├── src/
│   ├── api/
│   │   ├── axios.ts          # Axios instance + interceptor auto refresh
│   │   ├── auth.api.ts
│   │   ├── todos.api.ts
│   │   └── admin.api.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── todo/
│   │   │   ├── TodoCard.tsx
│   │   │   ├── TodoForm.tsx        ← DatePicker chặn ngày quá khứ
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoFilters.tsx
│   │   │   └── TagChip.tsx
│   │   └── admin/
│   │       ├── UserTable.tsx
│   │       ├── StatsCard.tsx
│   │       └── Charts/
│   │           ├── CompletionBarChart.tsx
│   │           ├── PriorityPieChart.tsx
│   │           └── ActivityLineChart.tsx
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── TodosPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminUsers.tsx
│   │       └── AdminTodos.tsx
│   │
│   ├── store/
│   │   └── authStore.ts      # Zustand: lưu user info + token
│   │
│   ├── hooks/
│   │   ├── useTodos.ts
│   │   └── useAdmin.ts
│   │
│   ├── theme/
│   │   └── theme.ts          # MUI v7 custom theme
│   │
│   ├── router/
│   │   ├── AppRouter.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── AdminRoute.tsx
│   │
│   └── utils/
│       └── dateUtils.ts      # Helper kiểm tra ngày hợp lệ
│
├── .env.example
├── Dockerfile
└── package.json
```

---

## 🔑 Business Logic quan trọng

### 1. Validation `due_date` (CRITICAL)

**Backend — `future-date.pipe.ts`:**
```typescript
// Từ chối mọi due_date < ngày hôm nay (00:00:00)
const today = new Date();
today.setHours(0, 0, 0, 0);
if (dueDate < today) {
  throw new BadRequestException('due_date phải là hôm nay hoặc tương lai');
}
```

**Frontend — MUI DatePicker:**
```tsx
<DatePicker
  label="Hạn chót"
  minDate={dayjs()} // Chặn chọn ngày quá khứ
  value={dueDate}
  onChange={setDueDate}
/>
```

### 2. Kiểm tra bị ban (Ban Guard)

```typescript
// Chạy sau JwtAuthGuard, trước mọi handler
@Injectable()
export class BanCheckGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (user.is_banned) {
      throw new ForbiddenException('Tài khoản của bạn đã bị khoá');
    }
    return true;
  }
}
```

### 3. Ownership Guard (USER chỉ sửa todo của mình)

```typescript
// Trong todos.service.ts
async findOneOrFail(id: number, userId: number) {
  const todo = await this.todoRepo.findOneBy({ id });
  if (!todo) throw new NotFoundException();
  if (todo.user_id !== userId) throw new ForbiddenException();
  return todo;
}
```

### 4. Cập nhật `updated_at` tự động

```typescript
// Trong todo.entity.ts
@UpdateDateColumn()
updated_at: Date;
```

---

## 🐳 Docker — Môi trường Local

### `docker-compose.yml`
```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: todoapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@db:5432/todoapp
      JWT_ACCESS_SECRET: dev_access_secret
      JWT_REFRESH_SECRET: dev_refresh_secret
      JWT_ACCESS_EXPIRES: 15m
      JWT_REFRESH_EXPIRES: 7d
      FRONTEND_URL: http://localhost:5173
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./backend/src:/app/src  # Hot reload dev
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: /api
    ports:
      - "5173:5173"
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src  # Hot reload dev
      - ./frontend/public:/app/public  # Hot reload public assets

volumes:
  postgres_data:
```

### Chạy local
```bash
# Clone và cài đặt
git clone <repo>
cd todo-app

# Khởi động toàn bộ stack
docker compose up -d

# Xem logs
docker compose logs -f backend

# Dừng
docker compose down

# Xoá sạch (bao gồm database)
docker compose down -v
```

---

## 🚀 Docker — Môi trường Production

### `docker-compose.prod.yml`
```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: todoapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@db:5432/todoapp
      JWT_ACCESS_SECRET: prod_access_secret_change_me
      JWT_REFRESH_SECRET: prod_refresh_secret_change_me
      JWT_ACCESS_EXPIRES: 15m
      JWT_REFRESH_EXPIRES: 7d
      FRONTEND_URL: http://localhost
      PORT: 3000
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: /api
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Dockerfile backend production (`backend/Dockerfile.prod`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Dockerfile frontend production (`frontend/Dockerfile.prod`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Deploy production
```bash
# Build và chạy production
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📋 Biến môi trường

### `.env.example`
```env
# Database
POSTGRES_DB=todoapp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Abc123456

# JWT (dùng chuỗi ngẫu nhiên dài >= 32 ký tự cho production)
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# CORS
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000
```

---

## 🧩 Thứ tự phát triển (cho Cursor)

Cursor nên thực hiện theo đúng thứ tự này để tránh dependency lỗi:

### Phase 1 — Khởi tạo dự án
- [ ] Tạo repo + cấu trúc thư mục gốc
- [ ] Khởi tạo NestJS project (`backend/`)
- [ ] Khởi tạo React + Vite project (`frontend/`)
- [ ] Tạo `docker-compose.yml` với service `db`
- [ ] Test kết nối PostgreSQL

### Phase 2 — Backend: Auth
- [ ] Tạo `User` entity + TypeORM config
- [ ] Implement `POST /auth/register` (bcrypt hash)
- [ ] Implement `POST /auth/login` (JWT trả về)
- [ ] Implement `POST /auth/refresh` (cookie httpOnly)
- [ ] Implement `POST /auth/logout`
- [ ] Viết `JwtAuthGuard`, `RolesGuard`, `BanCheckGuard`

### Phase 3 — Backend: Todos
- [ ] Tạo `Todo` entity + `Tag` entity
- [ ] Implement CRUD `/todos` (có phân trang + filter)
- [ ] Implement validation `due_date` >= hôm nay
- [ ] Implement `PATCH /todos/:id/toggle`
- [ ] Đảm bảo USER chỉ thấy và sửa todo của mình

### Phase 4 — Backend: Admin
- [ ] Implement `GET /admin/users` (phân trang)
- [ ] Implement `PATCH /admin/users/:id/ban`
- [ ] Implement `DELETE /admin/users/:id`
- [ ] Implement `GET /admin/todos` (tất cả todos)
- [ ] Implement `GET /admin/stats` + `/admin/stats/users`

### Phase 5 — Frontend: Auth Pages
- [ ] Setup MUI v7 theme + axios instance
- [ ] Trang đăng nhập (`/login`)
- [ ] Trang đăng ký (`/register`)
- [ ] Setup Zustand store lưu auth state
- [ ] Axios interceptor tự động refresh token

### Phase 6 — Frontend: Todo Pages
- [ ] Trang danh sách todo (`/todos`)
- [ ] Form tạo/sửa todo (có DatePicker chặn quá khứ)
- [ ] Bộ lọc và tìm kiếm
- [ ] Toggle hoàn thành, xoá todo
- [ ] Dashboard cá nhân (`/dashboard`)

### Phase 7 — Frontend: Admin Pages
- [ ] Trang quản lý người dùng (`/admin/users`)
- [ ] Trang xem tất cả todos (`/admin/todos`)
- [ ] Trang thống kê với biểu đồ (`/admin/dashboard`)

### Phase 8 — Docker hoàn chỉnh
- [x] Dockerfile cho backend (dev + prod)
- [x] Dockerfile cho frontend (dev + prod)
- [x] `docker-compose.prod.yml` + Nginx config
- [x] Test toàn bộ stack trên môi trường production local

---

## ⚠️ Những điểm cần chú ý đặc biệt

1. **`due_date` validation phải có ở CẢ HAI phía** — backend reject nếu client bỏ qua validation
2. **Ban check phải xảy ra ở mọi request** — không chỉ lúc login
3. **Admin không thể ban chính mình**
4. **Refresh token phải là cookie `httpOnly`** — không lưu trong localStorage
5. **CORS phải cấu hình `credentials: true`** để cookie hoạt động
6. **`updated_at` tự cập nhật** mỗi khi todo thay đổi (dùng `@UpdateDateColumn`)
7. **Cascade delete** — xoá user → xoá todos → xoá tags (đã có trong schema)
8. **Phân trang mặc định** — mọi endpoint list phải có `?page=1&limit=10`

---

## 🧪 Tài khoản test mặc định

Sau khi restore `backup.sql`, hệ thống có sẵn:

| Email | Role | Trạng thái |
|---|---|---|
| `quan@kontum.com` | USER | Active |

> **Tạo tài khoản ADMIN:** Chạy lệnh sau sau khi restore DB:
> ```sql
> UPDATE users SET role = 'ADMIN' WHERE email = 'quan@kontum.com';
> ```

---

*Generated for Cursor AI — Todo App với NestJS + MUI v7 + PostgreSQL + Docker*
