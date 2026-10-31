#!/usr/bin/env bash
# Коммит и безопасный push из workflow.
# Использование: bash .github/scripts/commit-push.sh "сообщение" путь [путь ...]
# Если за время работы в ветке появились чужие коммиты, делает pull --rebase и повторяет push.
set -euo pipefail

msg="$1"; shift
git config user.name "github-actions"
git config user.email "github-actions@users.noreply.github.com"

for p in "$@"; do
  [ -e "$p" ] && git add -A -- "$p"
done

if git diff --cached --quiet; then
  echo "Нет изменений для коммита."
  exit 0
fi

git commit -m "$msg"
branch="$(git rev-parse --abbrev-ref HEAD)"

for attempt in 1 2 3 4 5; do
  if ! git pull --rebase origin "$branch"; then
    git rebase --abort 2>/dev/null || true
    echo "::error::Конфликт при rebase — нужно разобрать вручную."
    exit 1
  fi
  if git push origin "HEAD:$branch"; then
    echo "Push выполнен (попытка $attempt)."
    exit 0
  fi
  echo "Push отклонён, повтор через $((attempt * 4)) с…"
  sleep $((attempt * 4))
done

echo "::error::Не удалось выполнить push после 5 попыток."
exit 1
