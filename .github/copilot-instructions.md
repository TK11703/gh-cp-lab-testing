# Copilot instructions

- This project is a React 19, TypeScript, and Vite service-request tracker.
- Write strict, type-safe TypeScript. Do not use explicit or implicit `any`; use precise types, `unknown`, and narrowing instead.
- Use React functional components and hooks. Follow existing component, state, naming, and formatting patterns; reuse shared types from `src/types.ts`.
- Keep business logic in pure functions in `src/lib`, separate from React and browser APIs. Add or update colocated `*.test.ts` files using Vitest, covering normal behavior and edge cases.
- Use semantic HTML and native controls. Associate form controls with visible labels, give interactive elements accessible names, and preserve keyboard access and visible focus.
- Reuse CSS variables from `src/index.css` and existing styles in `src/App.css`. Preserve the current typography, colors, spacing, and responsive visual style.
- Keep changes focused. Avoid new dependencies unless necessary; prefer existing project utilities and platform APIs.
- Before declaring implementation complete, run `npm test`, `npm run lint`, and `npm run build`. Fix failures caused by the changes and explicitly report any remaining failures or checks that could not run.
