# Cherry-pick workflow (Vercel / GitHub PR issues)

Use this when a teammate’s branch cannot merge cleanly (e.g. Vercel checks, or you need a fresh PR with the same commits rebased on `main`).

## Prerequisites

- Repo: `interview-fe` (adjust paths if you use another repo).
- You know the **source branch** name (e.g. `resume-fix`) and the **new branch** name (e.g. `resume-fix-02`).
- `main` is the branch you want to merge into.

## Step 1 — Update `main`

```bash
cd /path/to/interview-fe
git fetch origin
git checkout main
git pull origin main
```

## Step 2 — See what you will cherry-pick

List commits that are on the source branch but not on `main`:

```bash
git log --oneline main..resume-fix
```

Note the commit hash(es) (oldest first if there are several—you cherry-pick in chronological order).

## Step 3 — Create the new branch from `main`

```bash
git checkout -b resume-fix-02
```

(Replace `resume-fix-02` with your chosen branch name.)

## Step 4 — Cherry-pick

**Single commit:**

```bash
git cherry-pick <commit-sha>
```

**Multiple commits (oldest → newest):**

```bash
git cherry-pick <sha1> <sha2> <sha3>
```

If Git reports conflicts: fix files, `git add` them, then `git cherry-pick --continue`. To abort: `git cherry-pick --abort`.

## Step 5 — Fix “authored by X, committed by Y” (recommended)

Cherry-pick keeps the **original author** but sets **you** as **committer**. GitHub shows both; some tools (e.g. Vercel) may complain.

Rewrite the last commit so **author and committer** match your Git user (from `git config user.name` / `user.email`):

```bash
git commit --amend --reset-author --no-edit
```

If you need a clean commit message only:

```bash
git commit --amend -m "your message here"
```

**If a tool appends extra lines to the message** (e.g. trailers you did not type), recommit with hooks disabled:

```bash
git reset --soft HEAD~1
mkdir -p /tmp/emptygithooks
git -c core.hooksPath=/tmp/emptygithooks commit -m "your message here"
```

## Step 6 — Push the new branch

First push:

```bash
git push -u origin resume-fix-02
```

If you **amended** after already pushing, update the remote safely:

```bash
git push --force-with-lease origin resume-fix-02
```

## Step 7 — Open the PR

- Base: `main` (or your team’s default).
- Compare: `resume-fix-02`.
- In the description, credit the original author (e.g. “Changes from @teammate’s `resume-fix` branch”).

## Quick reference — common commands

| Goal | Command |
|------|--------|
| Commits only on feature branch | `git log --oneline main..feature-branch` |
| Undo last cherry-pick | `git cherry-pick --abort` |
| See author vs committer | `git log -1 --format=fuller` |

## Optional — cherry-pick with you as author in one step

If you prefer not to amend afterward:

```bash
git cherry-pick <sha> --no-commit
git -c core.hooksPath=/tmp/emptygithooks commit -m "message"
```

(`mkdir -p /tmp/emptygithooks` first if you use this pattern to avoid stray hooks.)
