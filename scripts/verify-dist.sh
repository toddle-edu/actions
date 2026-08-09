#!/usr/bin/env bash
#
# Verify that each action's committed dist/ bundle matches its src/ and lockfile.
#
# Both actions run from a committed dist/index.js. Dependency bumps that don't
# rebuild it leave the executed code unchanged — which is how this repo ended up
# shipping axios 1.2.2 with 29 open advisories while the lockfile looked current.
#
# GitHub Actions is disabled on this repository and will not be enabled (CI is moving
# to Jenkins). There is no server-side check and there will not be one, so this script
# plus the pre-commit hook in .githooks/ are the only guard. Run it before merging
# anything that touches dependencies or source.
#
#   ./scripts/verify-dist.sh              # check every action
#   ./scripts/verify-dist.sh pipeline-protection
#   REBUILD=1 ./scripts/verify-dist.sh    # rebuild and leave the result staged-ready
#
# Exit 0 = in sync. Exit 1 = drift (or a build failure).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ACTIONS=("http-request-action" "pipeline-protection")
if [ "$#" -gt 0 ]; then
  ACTIONS=("$@")
fi

REBUILD="${REBUILD:-0}"
failed=0

for action in "${ACTIONS[@]}"; do
  if [ ! -d "$action" ]; then
    echo "✗ $action: no such directory" >&2
    failed=1
    continue
  fi

  echo "── $action"
  (
    cd "$action"

    # Prefer a clean install so the build reflects the lockfile exactly, but fall
    # back to the existing tree when offline — a stale-but-present node_modules
    # still catches src/ drift, which is the common case in a pre-commit hook.
    # npm ci runs the "prepare" script, which already builds — so the explicit
    # build below is a no-op after a fresh install. Output is captured and only
    # surfaced when something fails.
    log="$(mktemp)"
    trap 'rm -f "$log"' EXIT

    if [ ! -d node_modules ] || [ "${CLEAN:-0}" = "1" ]; then
      echo "   installing (npm ci)…"
      if ! npm ci --no-audit --no-fund >"$log" 2>&1; then
        echo "   ✗ npm ci failed" >&2; sed 's/^/     /' "$log" >&2; exit 1
      fi
    fi

    echo "   building…"
    if ! npm run build >"$log" 2>&1; then
      echo "   ✗ build failed" >&2; sed 's/^/     /' "$log" >&2; exit 1
    fi
  )

  if [ -n "$(git status --porcelain -- "$action/dist")" ]; then
    if [ "$REBUILD" = "1" ]; then
      echo "   ↻ dist/ rebuilt and updated — review and commit:"
      git --no-pager diff --stat -- "$action/dist" | sed 's/^/     /'
    else
      echo "   ✗ dist/ is OUT OF SYNC with src/ and package-lock.json" >&2
      git --no-pager diff --stat -- "$action/dist" | sed 's/^/     /' >&2
      echo "     fix: (cd $action && npm ci && npm run build) then commit dist/" >&2
      failed=1
    fi
  else
    echo "   ✓ dist/ in sync"
  fi

  # Production deps are bundled into dist/ and reachable at runtime, so a high
  # advisory here is a real exposure. Dev-scope findings only affect the build
  # host and are reported without failing.
  if ! (cd "$action" && npm audit --omit=dev --audit-level=high --silent >/dev/null 2>&1); then
    echo "   ✗ high-severity advisory in PRODUCTION dependencies" >&2
    (cd "$action" && npm audit --omit=dev --audit-level=high 2>&1 | sed 's/^/     /' >&2) || true
    failed=1
  else
    echo "   ✓ no high-severity advisories in production deps"
  fi
done

if [ "$failed" -ne 0 ]; then
  echo
  echo "FAILED — see above." >&2
  exit 1
fi

echo
echo "All checked actions are in sync."
