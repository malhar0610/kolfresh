# AGENTS.md — Multi-Agent Working Agreement (Template)

<!--
HOW TO USE THIS TEMPLATE (human only; agents can ignore this comment)
1. Copy this file to the root of the project as AGENTS.md.
2. Fill in every [BRACKETED] placeholder in sections 1, 3 and 4.
3. Create .clinerules/00-read-agents.md containing one line:
   "Read AGENTS.md in the project root and follow it before doing anything."
   (Kilo Code and OpenCode read AGENTS.md from the project root on their own.)
4. Create one git worktree per agent (commands in section 2).
5. Open each worktree in its own VS Code window / terminal and start one agent in each.
-->

Every AI coding agent working in this repository must read this whole file before
taking any action, and must follow it for the entire session. If an instruction
from the user conflicts with this file, follow the user and say which rule you
are breaking.

---

## 1. Project

- **Project name:** [PROJECT NAME]
- **What it is:** [ONE OR TWO SENTENCES]
- **Full specification:** [PATH TO SPEC, e.g. docs/SPEC.md]
- **Tech stack:** [e.g. Next.js + TypeScript, PostgreSQL, Razorpay]
- **Main branch:** `main`
- **Current phase / goal:** [e.g. Phase 2 — catalogue, cart, checkout]
- **Human owner (final decision on everything):** [YOUR NAME]

---

## 2. Isolation: one agent, one branch, one folder

Agents do not share a working folder. Each agent works in its own git worktree
on its own branch. This is what actually prevents interference; the rest of this
file covers what worktrees cannot.

| Agent      | Branch            | Worktree folder            | Dev server port | Local database        |
|------------|-------------------|----------------------------|-----------------|-----------------------|
| Kilo Code  | `agent/kilo`      | `../[PROJECT]-kilo`        | 3001            | `[PROJECT]_kilo`      |
| OpenCode   | `agent/opencode`  | `../[PROJECT]-opencode`    | 3002            | `[PROJECT]_opencode`  |
| Cline      | `agent/cline`     | `../[PROJECT]-cline`       | 3003            | `[PROJECT]_cline`     |

Setup, run once by the human from the main project folder:

```bash
git worktree add ../[PROJECT]-kilo     -b agent/kilo
git worktree add ../[PROJECT]-opencode -b agent/opencode
git worktree add ../[PROJECT]-cline    -b agent/cline
```

Rules for every agent:

1. **Know who you are.** You are the agent named after the tool running you
   (Kilo Code, OpenCode or Cline). If you are unsure, ask the user before acting.
2. **Check where you are.** Before your first edit, run `git branch --show-current`
   and `pwd`. If either does not match your row in the table above, stop and tell
   the user.
3. **Stay in your folder.** Never read-modify-write, move or delete files outside
   your own worktree folder.
4. **Use only your own port and database.** Never stop, restart or reuse another
   agent's dev server, port, database or background process.

---

## 3. Ownership: who may edit what

You may create and edit files only inside the paths you own. You may read anything.

| Agent      | Role                    | Owns these paths (edit allowed)                     |
|------------|-------------------------|-----------------------------------------------------|
| Kilo Code  | [e.g. Frontend / UI]    | [e.g. `src/app/(customer)/**`, `src/components/**`] |
| OpenCode   | [e.g. Backend / API]    | [e.g. `src/server/**`, `src/app/api/**`, `tests/api/**`] |
| Cline      | [e.g. Admin panel]      | [e.g. `src/app/admin/**`, `tests/admin/**`]         |

### Shared files (one owner each)

These files are touched by everyone's work, so exactly one agent may edit each.
All other agents must request changes (section 6) instead of editing.

| Shared file or area                                   | Sole editor   |
|-------------------------------------------------------|---------------|
| `package.json`, lockfile, dependency installs         | [AGENT]       |
| Database schema and migrations                        | [AGENT]       |
| Shared types / API contracts (`[PATH]`)               | [AGENT]       |
| Config: env examples, build, lint, CI, tsconfig       | [AGENT]       |
| Global styles, theme, design tokens                   | [AGENT]       |
| Translations / locale files                           | [AGENT]       |
| `AGENTS.md`, `README.md`, `docs/**`                   | Human only    |

If a file is not listed anywhere, it belongs to nobody yet: ask the user before
editing it.

---

## 4. Task board

The human assigns tasks. Agents do not pick up, reassign or redefine tasks on
their own. Work only on tasks with your name in the Agent column.

| ID   | Task                              | Agent      | Depends on | Status      |
|------|-----------------------------------|------------|------------|-------------|
| T-01 | [TASK DESCRIPTION]                | [AGENT]    | —          | To do       |
| T-02 | [TASK DESCRIPTION]                | [AGENT]    | T-01       | To do       |
| T-03 | [TASK DESCRIPTION]                | [AGENT]    | —          | To do       |

Status values: To do · In progress · Blocked · Ready for review · Merged.

Only the human edits this table. Agents report status in their own status file
(section 5), and the human updates the board from those.

If your task depends on one that is not yet Merged, do not build your own
version of the missing piece. Code against the agreed contract (shared types /
API spec), use a clearly marked stub inside your own paths, and note it in your
status file.

---

## 5. Status files

Each agent keeps one status file and edits no other agent's status file:

- `.agents/status/kilo.md`
- `.agents/status/opencode.md`
- `.agents/status/cline.md`

Update yours when you start a task, when you become blocked, and when you finish.
Use this format:

```markdown
## [TASK ID] — [short title]
- Status: In progress | Blocked | Ready for review
- Updated: [date and time]
- Done so far: [bullets]
- Files changed: [paths]
- Stubs or assumptions: [anything another agent's work must later replace]
- Requests to other agents: [see section 6, or "none"]
- How to test: [commands and what should happen]
```

---

## 6. Requesting a change in someone else's files

When you need something changed in a path you do not own (a new dependency, a
schema column, a shared type, a translation key):

1. Do not make the edit yourself, not even a one-line change.
2. Add a request to your own status file under "Requests to other agents":
   who it is for, the exact file, the exact change, and why.
3. Tell the user in your reply that a request is waiting.
4. Continue with other work in your own paths, or mark the task Blocked.

The human passes the request to the owning agent, who makes the change on its
own branch.

---

## 7. Git rules

Allowed, on your own branch only:

- `git add <specific paths you own>` and `git commit`
- `git status`, `git diff`, `git log`
- `git fetch`, and `git merge main` into your own branch when the user asks you
  to sync

Commit messages start with your agent name and task ID, for example:
`[cline][T-07] Add procurement sheet export`

Never, without the user explicitly asking in this session:

- `git add -A` / `git add .` (stage paths by name instead)
- commit, merge, rebase or push to `main`
- `git push --force`, `git reset --hard`, `git clean`, `git stash`,
  `git checkout`/`git switch` to another branch, `git rebase`
- delete or rename branches or worktrees
- resolve a merge conflict in a file you do not own (stop and report it)

Integration into `main` is done by the human, one branch at a time. After each
merge the human asks the other agents to sync with `main`.

---

## 8. Things no agent does without asking the user first

- Install, upgrade or remove a dependency (unless you are its sole editor)
- Create, edit or run a database migration (unless you are its sole editor)
- Delete or rename files or folders that existed before your task
- Reformat, re-lint or "tidy" files you were not asked to change
- Refactor code outside your owned paths
- Change environment variables, secrets, ports or build configuration
- Run commands that affect anything outside your worktree folder
- Deploy, publish, or call any paid or production service

Never write secrets, keys or passwords into any file that is tracked by git.

---

## 9. Start-of-session checklist

1. Read this file fully.
2. Confirm your identity, branch and folder (section 2).
3. Read the specification named in section 1.
4. Find your tasks on the board (section 4) and read your status file.
5. Tell the user, in three or four lines: who you are, which task you will work
   on, which paths you will touch, and anything that blocks you.
6. Wait for the user's go-ahead if anything is unclear; otherwise begin.

## 10. End-of-task checklist

1. Run the tests and linter for the paths you changed; fix what you broke.
2. Confirm with `git status` that every changed file is inside your owned paths.
3. Commit on your own branch with the message format in section 7.
4. Update your status file to "Ready for review", including how to test.
5. Report to the user: what was done, what was stubbed, any open requests.
6. Stop. Do not start another task until one is assigned to you.

---

## 11. If something goes wrong

Stop and report to the user, without trying to fix it yourself, when:

- you find edits in your owned paths that you did not make
- you are on the wrong branch or in the wrong folder
- a merge or sync produces conflicts in files you do not own
- two rules in this file contradict each other, or a task needs a path nobody owns
- a command failed in a way that may have affected files outside your worktree
