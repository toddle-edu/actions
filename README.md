# github-actions

Toddle's shared GitHub Actions and reusable workflows.

## Composite actions

- [`http-request-action/`](./http-request-action) — issues HTTP requests from a workflow.
- [`pipeline-protection/`](./pipeline-protection) — guards sensitive pipeline steps.

## Reusable workflows

Reusable workflows live under [`.github/workflows/`](./.github/workflows). Consumer repos call them via `uses:` with `secrets: inherit`.

### `claude-code-review.yml`

Runs Claude Code's `code-review` plugin on a pull request.

```yaml
# In a consumer repo: .github/workflows/claude-code-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, ready_for_review, reopened]

concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  review:
    uses: toddle-edu/actions/.github/workflows/claude-code-review.yml@develop
    secrets: inherit
```

### `claude.yml`

Handles interactive `@claude` mentions on issues, PR comments, and PR reviews.

```yaml
# In a consumer repo: .github/workflows/claude.yml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))
    uses: toddle-edu/actions/.github/workflows/claude.yml@develop
    secrets: inherit
```

### Consumer prerequisites

Set once at the org level (or per repo):

- **Variable** `CLAUDE_OAUTH_TOKEN_NAMES` — newline-separated list of OAuth secret names to round-robin through (e.g. `CLAUDE_CODE_OAUTH_TOKEN_ANKIT`).
- **Secrets** `CLAUDE_CODE_OAUTH_TOKEN_*` — one per team member listed in the variable.
- **Secret** `OTEL_EXPORTER_OTLP_HEADERS` — auth header for the Alloy telemetry endpoint.

Rotating the member list (add/remove) is done by editing the org variable alone — no changes to consumer repos needed.
