# github-actions

Toddle's GitHub Actions for workflows.

| Action | Purpose |
| --- | --- |
| [`pipeline-protection`](pipeline-protection) | Gates a workflow on the actor's membership of named org teams |
| [`http-request-action`](http-request-action) | Sends an HTTP request and returns the response body |

## Before you change anything

**These actions run from a committed `dist/index.js` bundle.** `action.yml` points at
`dist/`, not `src/`. Editing source or bumping a dependency changes nothing at runtime
until the bundle is rebuilt and committed.

This is not hypothetical: the repo shipped axios 1.2.2 with 29 open advisories for
three years while `package-lock.json` looked like it was being maintained, because 21
Dependabot PRs had updated the lockfile and none had rebuilt the bundle.

**GitHub Actions is disabled on this repository and will not be enabled** — CI is moving
to Jenkins and these actions are expected to be retired with it. There is therefore no
server-side check on this repo and there will not be one.

**Rebuilding `dist/` is the developer's responsibility.** Commit the rebuilt bundle in
the same PR as the code or dependency change. The pre-commit hook below enforces it
locally; nothing else will.

### Enable the pre-commit hook (once per clone)

```bash
git config core.hooksPath .githooks
```

It rebuilds and verifies the affected action whenever you stage a change to `src/`,
`package.json`, `package-lock.json` or `webpack.config.js`, and blocks the commit on drift.

### Run the check by hand

```bash
./scripts/verify-dist.sh                      # both actions
./scripts/verify-dist.sh pipeline-protection  # just one
REBUILD=1 ./scripts/verify-dist.sh            # rebuild rather than just report
```

It verifies the bundle matches source and lockfile, and fails on high-severity
advisories in **production** dependencies (those ship inside `dist/`). Dev-scope
advisories are reported without failing — they only affect the build host.

## Dependabot PRs need manual handling

Dependabot edits `package.json` and `package-lock.json` only. It cannot rebuild the
bundle, and with Actions disabled nothing catches that. **Never merge a Dependabot PR
directly.** Instead:

```bash
gh pr checkout <number>
REBUILD=1 ./scripts/verify-dist.sh
git add */dist && git commit -m "chore: rebuild dist" && git push
```

Then merge. [`.github/dependabot.yml`](.github/dependabot.yml) groups updates by
directory and by production/development scope to keep this to a few PRs at a time.

## Releasing

Every consuming workflow references these actions as `@develop`:

| Action | Call sites | Repos |
| --- | --- | --- |
| `pipeline-protection` | 30 | 28 |
| `http-request-action` | 29 | 11 |

**A merge to `develop` is an immediate org-wide deploy.** There is no staged rollout and
no version pinning. To test a change safely, point one low-traffic repo at your branch
(`uses: toddle-edu/actions/pipeline-protection@your-branch`), verify, then revert.

Rollback is `git revert` on `develop`, which propagates just as quickly.

## Local development

Node version is pinned per action in `.nvmrc` (currently v24). Both actions target the
`node24` runtime and use ESM source bundled to CJS by webpack.

```bash
cd pipeline-protection
npm ci        # runs "prepare", which builds dist/
npm run build
```
