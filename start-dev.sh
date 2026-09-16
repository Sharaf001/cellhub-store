#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
powershell -NoProfile -ExecutionPolicy Bypass -File "$root/start-dev.ps1"