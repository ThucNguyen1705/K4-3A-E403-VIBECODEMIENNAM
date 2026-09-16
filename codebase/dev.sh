#!/usr/bin/env bash
# ============================================================
# VLearn dev runner — chạy database (Docker) + backend + frontend
#
#   ./dev.sh          Chạy toàn bộ (Ctrl+C để dừng BE/FE)
#   ./dev.sh stop     Tắt container database
#   ./dev.sh reset    XOÁ dữ liệu DB, tạo lại schema + seed
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BE="$ROOT/be"
FE="$ROOT/fe"
COMPOSE=(docker compose -f "$BE/docker-compose.yml")

BLUE=$'\e[34m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RED=$'\e[31m'; BOLD=$'\e[1m'; RESET=$'\e[0m'
log()  { echo "${BOLD}${BLUE}▶${RESET} $*"; }
ok()   { echo "${GREEN}✔${RESET} $*"; }
warn() { echo "${YELLOW}!${RESET} $*"; }
die()  { echo "${RED}✘ $*${RESET}" >&2; exit 1; }

port_busy() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

# ---------- Docker ----------
ensure_docker() {
  command -v docker >/dev/null || die "Chưa cài Docker"
  docker info >/dev/null 2>&1 && return

  log "Docker chưa chạy, đang khởi động Docker Desktop..."
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*) "/c/Program Files/Docker/Docker/Docker Desktop.exe" >/dev/null 2>&1 & ;;
    Darwin)               open -a Docker ;;
    *)                    die "Hãy khởi động Docker daemon rồi chạy lại" ;;
  esac
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && { ok "Docker đã sẵn sàng"; return; }
    sleep 3
  done
  die "Docker không khởi động được sau 3 phút"
}

start_db() {
  log "Khởi động PostgreSQL + Adminer..."
  "${COMPOSE[@]}" up -d --wait db adminer >/dev/null
  ok "Database: localhost:5433 · Adminer: http://localhost:8080"
}

# ---------- Chuẩn bị project ----------
prepare() {
  command -v node >/dev/null || die "Chưa cài Node.js"
  [[ -f "$BE/.env" ]] || { cp "$BE/.env.example" "$BE/.env"; ok "Đã tạo be/.env từ .env.example"; }
  for dir in "$BE" "$FE"; do
    if [[ ! -d "$dir/node_modules" ]]; then
      log "npm install trong $(basename "$dir")..."
      npm --prefix "$dir" install --no-fund --no-audit >/dev/null
    fi
  done
}

# ---------- Quản lý tiến trình ----------
PIDS=()

# In log có tiền tố màu: [be] ..., [fe] ...
prefix() { local tag="$1"; while IFS= read -r line; do printf '%s %s\n' "$tag" "$line"; done; }

run_app() { # run_app <tên> <thư mục> <cổng> <màu>
  local name="$1" dir="$2" port="$3" color="$4"
  if port_busy "$port"; then
    warn "Cổng $port đang được dùng — bỏ qua $name (có thể đã chạy sẵn)"
    return
  fi
  npm --prefix "$dir" run dev > >(prefix "${color}[$name]${RESET}") 2>&1 &
  PIDS+=("$!")
}

kill_tree() {
  local pid="$1"
  if [[ -r "/proc/$pid/winpid" ]]; then # Git Bash trên Windows: kill cả cây tiến trình node
    taskkill //F //T //PID "$(cat "/proc/$pid/winpid")" >/dev/null 2>&1 || true
  else
    local child
    for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
    kill "$pid" 2>/dev/null || true
  fi
}

cleanup() {
  trap - INT TERM EXIT
  echo
  log "Đang dừng backend & frontend..."
  for pid in "${PIDS[@]}"; do kill_tree "$pid"; done
  ok "Đã dừng. Database vẫn chạy (tắt bằng: ./dev.sh stop)"
  exit 0
}

# ---------- Lệnh ----------
case "${1:-start}" in
  start)
    ensure_docker
    prepare
    start_db
    npm --prefix "$BE" run setup --silent 2>/dev/null | tail -n 1 || warn "Migrate/seed thất bại (bỏ qua)"

    trap cleanup INT TERM EXIT
    run_app be "$BE" 4000 "$BLUE"
    run_app fe "$FE" 5173 "$GREEN"

    echo
    ok "${BOLD}Frontend:${RESET} http://localhost:5173   ${BOLD}API:${RESET} http://localhost:4000/api"
    ok "Tài khoản demo: demo@vlearn.dev / 123456 — nhấn Ctrl+C để dừng"
    echo

    [[ ${#PIDS[@]} -gt 0 ]] && wait
    ;;
  stop)
    ensure_docker
    "${COMPOSE[@]}" down
    ok "Đã tắt database"
    ;;
  reset)
    ensure_docker
    prepare
    read -r -p "${YELLOW}Xoá TOÀN BỘ dữ liệu database? (y/N) ${RESET}" answer
    [[ "$answer" =~ ^[yY]$ ]] || exit 0
    "${COMPOSE[@]}" down -v
    start_db
    npm --prefix "$BE" run setup --silent
    ;;
  *)
    echo "Cách dùng: ./dev.sh [start|stop|reset]"
    exit 1
    ;;
esac
