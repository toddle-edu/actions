<!--
  GitHub Actions is disabled on this repository, so .github/workflows/verify-dist.yml
  does not run. These checks are manual. Please don't skip them.
-->

## What changed



## Bundle check

Both actions execute a **committed `dist/index.js`**. A dependency or source change
that isn't rebuilt does not reach the code that actually runs — that is how this repo
shipped axios 1.2.2 with 29 open advisories while its lockfile looked current.

- [ ] Ran `./scripts/verify-dist.sh` and it passed
- [ ] `dist/` is committed in this PR, **or** this PR touches no `src/`, `package.json`, `package-lock.json` or `webpack.config.js`

> **Dependabot PRs never rebuild `dist/`.** Do not merge one directly. Check the branch
> out locally, run `REBUILD=1 ./scripts/verify-dist.sh`, and commit the rebuilt bundle
> to the same branch before merging.

## Consumer impact

28 repositories reference these actions as `@develop`, so **merging deploys immediately
org-wide** — there is no staged rollout.

- [ ] Considered the blast radius; `pipeline-protection` changes gate deploys in all 28
