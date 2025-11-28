# Contributing to DawaLink

Thank you for considering contributing! This guide outlines the workflow and standards for the project.

## Development Workflow
1. Fork the repository and clone locally.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Install dependencies:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`
4. Copy environment templates:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
5. Generate Prisma client: `cd backend && npx prisma generate`.
6. Run backend: `npm run dev` and frontend: `npm run dev`.
7. Write tests (Jest + Supertest) under `backend/src/tests`.
8. Ensure all tests pass: `npm test`.
9. Lint code: `npm run lint` (fix with `npm run lint:fix`).
10. Commit with conventional style: `feat: add prescriptions listing filter`.
11. Push and open a Pull Request (PR).

## Coding Standards
- TypeScript enforced across backend & frontend.
- Avoid `any`; if necessary, isolate and justify.
- Use centralized error handling rather than ad-hoc try/catch with `res.status(500)`.
- Validation: All input via Zod schemas or structured validators.
- Transactional operations for multi-step persistence (e.g., orders).

## Testing
- Use Supertest for HTTP layer.
- Minimum: happy path + at least one failure path (validation/authorization).
- Run `npm test` before PR submission.
- CI will run tests + type check automatically.

## Git Commit Conventions
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `chore:` tooling / dependencies
- `refactor:` code refactor without behavior change
- `test:` adding or adjusting tests

## PR Requirements
- Linked issue (if applicable)
- Description of change & rationale
- Screenshots (frontend changes)
- Test results summary

## Security
- Never commit secrets (.env is ignored)
- Validate all user inputs
- Sanitize strings (middleware already applied)

## Need Help?
Open an issue or email support@dawalink.co.ke.

Welcome aboard! 🚀
