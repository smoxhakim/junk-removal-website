## Project rules

**Scope**
- Read ARCHITECTURE.md (stack, data model, roadmap) and TODO.md (task status) before implementing; PRD.md holds product intent.
- Implement only the current task's scope. No tables, routes or integrations from later phases.

**No fake data**
- No fake data and no fake success responses in production code paths.
- Business facts the owner has not supplied (phone, address, license, reviews, prices) are never invented. Use clearly marked placeholders driven from the database or config.

**Git workflow**
- One feature branch per task, created from the latest `origin/main`.
- Commit and push the branch, report branch, commit hash, changes and verification, then stop and wait for approval.
- Never commit or push to `main`, never open or merge a pull request, never enable auto-merge, never force-push. The owner opens and merges all PRs.

**Verification before every commit**
- `npx prisma validate`, `npx prisma migrate status`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- DB tests must run, not skip: the local database below must be running and `.env` must point at it. Confirm `npm test` reports 0 skipped. Never set `ALLOW_DB_WRITE_TESTS`. If the local database can't be started, stop and report.
- If `/review` edits anything, re-run all verification commands before committing.

**Local database**
- Docker container `junk-removal-postgres` (PostgreSQL 17) on host port 5433, bound to 127.0.0.1 only, volume `junk-removal-pgdata`. If it is stopped: `docker start junk-removal-postgres`. Setup details are in README.md.
- Port 5432 belongs to another project and must not be touched.
- `.env` is never committed.

**TODO.md** is updated only when a task is verified, on that task's branch.

**gstack** (installed globally at `~/.claude/skills/gstack`)
- Allowed: `/plan-eng-review` (before large tasks), `/design-consultation` and `/plan-design-review` (design work), `/review` (before committing), `/qa-only` and `/browse` (checking pages in a real browser), `/investigate` (debugging).
- Forbidden in this repo: `/ship` (both the built-in Claude Code command and the gstack skill), `/land-and-deploy`, `/setup-deploy`, `/canary`, and any skill or command that opens a PR, merges or deploys.
- `/qa` is not used because it commits fixes on its own; use `/qa-only` and report.
- Any gstack skill not listed as Allowed is not used (this includes `/design-review`, which also commits fixes on its own).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
