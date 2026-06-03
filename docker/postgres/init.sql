-- Todo App schema (khớp README — không đổi cấu trúc bảng)

CREATE TYPE public.user_role AS ENUM ('USER', 'ADMIN');

CREATE TABLE public.users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          user_role DEFAULT 'USER' NOT NULL,
    is_banned     BOOLEAN DEFAULT false NOT NULL,
    created_at    TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE public.todos (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    due_date    TIMESTAMP,
    priority    TEXT DEFAULT 'Low' NOT NULL,
    completed   BOOLEAN DEFAULT false NOT NULL,
    created_at  TIMESTAMP DEFAULT now() NOT NULL,
    updated_at  TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE public.tags (
    id         SERIAL PRIMARY KEY,
    todo_id    INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);
