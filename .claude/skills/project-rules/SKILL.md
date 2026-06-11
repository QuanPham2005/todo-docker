# Comprehensive Agent Skills & Guardrails (FE & BE)

This skill file forces the AI to dynamically apply specialized engineering constraints based on the workspace partition (Frontend vs. Backend).

---

## 💻 SECTION 1: FRONTEND SKILLS
*Source Map: Located in `./frontend/skills-lock.json`*

### 1. react-best-practices & composition-patterns (`vercel-labs/agent-skills`)
- **Architecture:** Use functional components with hooks. Prefer composition over deeply nested prop-drilling.
- **State Management:** Isolate local UI state using `useState`. Move heavy business logic, API tracking, and side-effects out of components into custom hooks (`/hooks`).
- **Performance:** Memoize expensive calculations with `useMemo` and functions passed to children with `useCallback` only when necessary. Ensure proper dependency arrays.

### 2. frontend-design (`anthropics/skills`)
- **UI/UX Consistency:** Strictly follow the pre-defined layout, typography, and styling tokens in `./frontend/src/theme` or css variables.
- **Components:** Prioritize reusing shared UI components inside `./frontend/src/components` before writing new ones.

### 3. typescript-advanced-types (`wshobson/agents`)
- **Strictness:** Absolutely NO `any` types. If a type is unknown, use `unknown` or generics `<T>`.
- **Patterns:** Utilize advanced utility types (`Pick`, `Omit`, `Partial`, `Record`) to keep components types safe and avoid rewriting interfaces.

### 4. accessibility (a11y) & seo (`addyosmani/web-quality-skills`)
- **A11y:** Ensure interactive elements have semantic HTML tags (`<button>`, `<nav>`), correct `aria-*` attributes, and clear focus states.
- **SEO:** Maintain semantic markup hierarchy (`<h1>` to `<h6>`). Ensure metadata is dynamically managed per route.

### 5. vite (`antfu/skills`)
- Follow modular entry points. Ensure aliases defined in `vite.config.ts` (like `@/*`) are properly mapped and used in import paths.

---

## ⚙️ SECTION 2: BACKEND SKILLS
*Source Map: Located in `./backend/skills-lock.json`*

### 1. nestjs-best-practices (`kadajett/agent-nestjs-skills`)
- **Architecture:** Enforce strict Modular Architecture. Every feature (e.g., `todos`, `users`) must have its own `.module.ts`, `.controller.ts`, and `.service.ts`.
- **Validation:** Every request payload must be strictly validated using class-validator decorators inside explicit DTO files (`.dto.ts`).
- **Dependency Injection:** Strictly use NestJS constructor injection. Do not instantiate services manually.

### 2. nodejs-backend-patterns & nodejs-best-practices (`wshobson/agents` & `sickn33/...`)
- **Error Handling:** Centralize global exception filters. Never let raw database errors leak directly to the client response; wrap them in appropriate `HttpException`.
- **Async Handling:** Use clean async/await patterns. Avoid deeply nested promises and wrap potential runtime panics inside try/catch or custom Interceptors.

### 3. typescript-advanced-types (Backend Plugin - `wshobson/agents`)
- Enforce strict typing across Data Transfer Objects (DTOs), Entities, and Request/Response layers.
- Map database entity interfaces cleanly to application layer interfaces using dedicated mappers or serialization decorators.

---

## 🎯 SECTION 3: EXECUTION RULES FOR OPENCLAUDE
1. **Context Verification:** Before generating, modifying, or refactoring code, detect whether the target file path contains `/frontend/` or `/backend/`.
2. **Constraint Application:** - If path matches `/frontend/`, apply **Section 1** constraints exclusively.
   - If path matches `/backend/`, apply **Section 2** constraints exclusively.
3. **Guardrails:** Reject any code suggestions that violate strict TypeScript definitions or compromise the structural patterns defined above.