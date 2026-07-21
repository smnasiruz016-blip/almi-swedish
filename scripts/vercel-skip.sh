#!/usr/bin/env bash
# Vercel "Ignore Build Step" command. Exit 0 = SKIP build, exit 1 = BUILD.
#
# Skips a deploy whose only changes are docs / tests / CI / editor config, so a
# README or *.test.ts push does not trigger a full rebuild + ISR cache flush.
#
# This logic used to live inline in vercel.json's "ignoreCommand". Vercel caps
# that field at 256 chars and the pathspec list was 260 — Vercel rejected the
# config and EVERY deploy errored (not the DB, not next build). Moved to a script
# so the field is ~25 chars and can never hit the limit again. One file, all forks.
#
# The script's exit status is `git diff --quiet`'s: 0 when nothing outside the
# excluded paths changed (skip), 1 when real source changed (build).
git diff --quiet "${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}" HEAD -- . ':(exclude)*.md' ':(exclude)docs/**' ':(exclude)**/*.test.ts' ':(exclude)**/*.test.tsx' ':(exclude)**/*.spec.ts' ':(exclude).github/**' ':(exclude)README*' ':(exclude)LICENSE*' ':(exclude).vscode/**'
