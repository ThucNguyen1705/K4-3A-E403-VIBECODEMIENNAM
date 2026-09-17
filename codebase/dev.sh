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

# Cổng có đang bị chính VLearn (lần chạy cũ) chiếm không?
is_ours() { # is_ours <tên> <cổng>
  case "$1" in
    be) curl -s --max-time 2 "http://localhost:$2/api/health" | grep -q '"status":"ok"' ;;
    fe) curl -s --max-time 2 -o /dev/null -w '%{http_code}' "http://localhost:$2/@vite/client" | grep -q 200 ;;
  esac
}

# Tắt tiến trình đang LISTEN trên cổng (kèm tiến trình cha `node --watch` nếu có)
free_port() { # free_port <cổng>
  local port="$1"
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
      powershell.exe -NoProfile -Command "
        Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
          \$p = Get-CimInstance Win32_Process -Filter \"ProcessId=\$(\$_.OwningProcess)\"
          \$parent = Get-CimInstance Win32_Process -Filter \"ProcessId=\$(\$p.ParentProcessId)\" -ErrorAction SilentlyContinue
          if (\$parent -and \$parent.CommandLine -match '--watch') { Stop-Process -Id \$parent.ProcessId -Force -ErrorAction SilentlyContinue }
          Stop-Process -Id \$p.ProcessId -Force -ErrorAction SilentlyContinue
        }" >/dev/null 2>&1 || true
      ;;
    *)
      local pid ppid
      for pid in $(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null); do
        ppid="$(ps -o ppid= -p "$pid" | tr -d ' ')"
        ps -o args= -p "$ppid" 2>/dev/null | grep -q -- '--watch' && kill "$ppid" 2>/dev/null
        kill "$pid" 2>/dev/null || true
      done
      ;;
  esac
  for _ in $(seq 1 20); do port_busy "$port" || return 0; sleep 0.5; done
  return 1
}

run_app() { # run_app <tên> <thư mục> <cổng> <màu>
  local name="$1" dir="$2" port="$3" color="$4"
  if port_busy "$port"; then
    is_ours "$name" "$port" || die "Cổng $port đang bị một chương trình khác chiếm — hãy tắt nó rồi chạy lại"
    warn "Phát hiện $name cũ đang chạy ở cổng $port — tắt và khởi động lại"
    free_port "$port" || die "Không giải phóng được cổng $port"
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

    # Cổng backend đọc từ be/.env (Vite cũng đọc cùng giá trị này để proxy /api)
    API_PORT="$(grep -E '^PORT=' "$BE/.env" | cut -d= -f2 | tr -d '\r ')"
    API_PORT="${API_PORT:-8000}"

    trap cleanup INT TERM EXIT
    run_app be "$BE" "$API_PORT" "$BLUE"
    run_app fe "$FE" 5173 "$GREEN"

    echo
    ok "${BOLD}Frontend:${RESET} http://localhost:5173   ${BOLD}API:${RESET} http://localhost:$API_PORT/api"
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
