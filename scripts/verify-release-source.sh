#!/usr/bin/env bash
set -euo pipefail

release_branch="${RELEASE_BRANCH:-redesign-experiment}"
branch="$(git branch --show-current)"

if [[ "$branch" != "$release_branch" ]]; then
  echo "Release blocked: expected branch '$release_branch', found '$branch'." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release blocked: commit or remove all working-tree changes first." >&2
  git status --short >&2
  exit 1
fi

upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
if [[ -z "$upstream" ]]; then
  echo "Release blocked: '$branch' has no upstream branch." >&2
  exit 1
fi

remote="${upstream%%/*}"
remote_branch="${upstream#*/}"
git fetch --quiet "$remote" "$remote_branch"

if [[ "$(git rev-parse HEAD)" != "$(git rev-parse "$upstream")" ]]; then
  echo "Release blocked: local HEAD does not match '$upstream'. Push or pull first." >&2
  exit 1
fi

echo "Release source verified: $(git rev-parse --short HEAD) on $upstream."
