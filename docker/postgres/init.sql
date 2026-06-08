-- Todo App schema — 5-state status system

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
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    due_date             TIMESTAMPTZ,
    priority             TEXT DEFAULT 'Low' NOT NULL,
    status               VARCHAR(20) DEFAULT 'todo' NOT NULL,
    cancellation_reason  TEXT,
    created_at           TIMESTAMP DEFAULT now() NOT NULL,
    updated_at           TIMESTAMP DEFAULT now() NOT NULL,
    CONSTRAINT todos_status_check CHECK (
        status IN ('todo', 'in_progress', 'done', 'overdue', 'cancelled')
    )
);

CREATE TABLE public.tags (
    id         SERIAL PRIMARY KEY,
    todo_id    INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_status ON public.todos(status);
CREATE INDEX idx_todos_due_date ON public.todos(due_date);
