#!/bin/sh
set -e
# Symlinks to an available Vale binary, if possible
#
# As of 2022-05-18, the Vale downloader script at
# https://install.goreleaser.com/github.com/ValeLint/vale.sh
# appears to no longer be available.
#
# This script is a cut-down version of a GoReleaser script, which we use
# to determine platform/os. No downloading is required, since a
# selection of Vale binaries is included in this folder.

usage() {
  this=$1
  cat <<EOF
$this: symlink go binaries for errata-ai/vale

Usage: $this [-b] bindir [-d] [tag]
  -b sets bindir or installation directory, Defaults to ./bin
  -d turns on debug logging

EOF
  exit 2
}

parse_args() {
  #BINDIR is ./bin unless set be ENV
  # over-ridden by flag below

  BINDIR=./bin
  while getopts "b:dh?x" arg; do
    case "$arg" in
      b) BINDIR="$OPTARG" ;;
      d) log_set_priority 10 ;;
      h | \?) usage "$0" ;;
      x) set -x ;;
    esac
  done
  shift $((OPTIND - 1))
  TAG=$1
}

get_binaries() {
  case "$PLATFORM" in
    darwin/386) BINARIES="vale" ;;
    darwin/amd64) BINARIES="vale" ;;
    darwin/arm64) BINARIES="vale" ;;
    darwin/armv6) BINARIES="vale" ;;
    darwin/armv7) BINARIES="vale" ;;
    linux/386) BINARIES="vale" ;;
    linux/amd64) BINARIES="vale" ;;
    linux/arm64) BINARIES="vale" ;;
    linux/armv6) BINARIES="vale" ;;
    linux/armv7) BINARIES="vale" ;;
    openbsd/386) BINARIES="vale" ;;
    openbsd/amd64) BINARIES="vale" ;;
    openbsd/arm64) BINARIES="vale" ;;
    openbsd/armv6) BINARIES="vale" ;;
    openbsd/armv7) BINARIES="vale" ;;
    windows/386) BINARIES="vale" ;;
    windows/amd64) BINARIES="vale" ;;
    windows/arm64) BINARIES="vale" ;;
    windows/armv6) BINARIES="vale" ;;
    windows/armv7) BINARIES="vale" ;;
    *)
      log_crit "platform $PLATFORM is not supported.  Make sure this script is up-to-date and file request at https://github.com/${PREFIX}/issues/new"
      exit 1
      ;;
  esac
}

tag_to_version() {
  # if version starts with 'v', remove it
  VERSION=${TAG#v}
}

adjust_os() {
  # adjust archive name based on OS
  case ${OS} in
    386) OS=i386 ;;
    amd64) OS=amd64 ;;
    darwin) OS=macos ;;
    linux) OS=linux ;;
    openbsd) OS=openbsd ;;
    windows) OS=windows ;;
  esac
  true
}

adjust_arch() {
  # adjust archive name based on ARCH
  case ${ARCH} in
    386) ARCH=i386 ;;
    amd64) ARCH=amd64 ;;
    darwin) ARCH=macos ;;
    linux) ARCH=linux ;;
    openbsd) ARCH=openbsd ;;
    windows) ARCH=windows ;;
  esac
  true
}

is_command() {
  command -v "$1" >/dev/null
}
echoerr() {
  echo "$@" 1>&2
}
log_prefix() {
  echo "$0"
}
_logp=6
log_set_priority() {
  _logp="$1"
}
log_priority() {
  if test -z "$1"; then
    echo "$_logp"
    return
  fi
  [ "$1" -le "$_logp" ]
}

log_tag() {
  case $1 in
    0) echo "emerg" ;;
    1) echo "alert" ;;
    2) echo "crit" ;;
    3) echo "err" ;;
    4) echo "warning" ;;
    5) echo "notice" ;;
    6) echo "info" ;;
    7) echo "debug" ;;
    *) echo "$1" ;;
  esac
}

log_debug() {
  log_priority 7 || return 0
  echoerr "$(log_prefix)" "$(log_tag 7)" "$@"
}
log_info() {
  log_priority 6 || return 0
  echoerr "$(log_prefix)" "$(log_tag 6)" "$@"
}
log_err() {
  log_priority 3 || return 0
  echoerr "$(log_prefix)" "$(log_tag 3)" "$@"
}
log_crit() {
  log_priority 2 || return 0
  echoerr "$(log_prefix)" "$(log_tag 2)" "$@"
}

uname_os() {
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  case "$os" in
    cygwin_nt*) os="windows" ;;
    mingw*) os="windows" ;;
    msys_nt*) os="windows" ;;
  esac
  echo "$os"
}

uname_os_check() {
  os=$(uname_os)
  case "$os" in
    darwin) return 0 ;;
    dragonfly) return 0 ;;
    freebsd) return 0 ;;
    linux) return 0 ;;
    android) return 0 ;;
    nacl) return 0 ;;
    netbsd) return 0 ;;
    openbsd) return 0 ;;
    plan9) return 0 ;;
    solaris) return 0 ;;
    windows) return 0 ;;
  esac
  log_crit "uname_os_check '$(uname -s)' got converted to '$os' which is not a GOOS value."
  return 1
}

uname_arch() {
  arch=$(uname -m)
  case $arch in
    x86_64) arch="amd64" ;;
    x86) arch="386" ;;
    i686) arch="386" ;;
    i386) arch="386" ;;
    aarch64) arch="arm64" ;;
    armv5*) arch="armv5" ;;
    armv6*) arch="armv6" ;;
    armv7*) arch="armv7" ;;
  esac
  echo ${arch}
}

uname_arch_check() {
  arch=$(uname_arch)
  case "$arch" in
    386) return 0 ;;
    amd64) return 0 ;;
    arm64) return 0 ;;
    armv5) return 0 ;;
    armv6) return 0 ;;
    armv7) return 0 ;;
    ppc64) return 0 ;;
    ppc64le) return 0 ;;
    mips) return 0 ;;
    mipsle) return 0 ;;
    mips64) return 0 ;;
    mips64le) return 0 ;;
    s390x) return 0 ;;
    amd64p32) return 0 ;;
  esac
  log_crit "uname_arch_check '$(uname -m)' got converted to '$arch' which is not a GOARCH value."
  return 1
}


# ---------------------------------------------------------------------

PROJECT_NAME="vale"
OWNER=errata-ai
OS=$(uname_os)
ARCH=$(uname_arch)
PREFIX="$OWNER/$PROJECT_NAME"

# use in logging routines
log_prefix() {
	echo "$PREFIX"
}
PLATFORM="${OS}/${ARCH}"

VALE_DIR=$(dirname $0)

uname_os_check "$OS"
uname_arch_check "$ARCH"

parse_args "$@"

get_binaries

tag_to_version

adjust_os

adjust_arch

NAME=${PROJECT_NAME}-${VERSION}-${OS}-${ARCH}
FILENAME="$VALE_DIR/$NAME"
VALE="$BINDIR/vale"

# Perform symlink, if a suitable vale binary exists
if [ -x ./$FILENAME ]; then
  if [ -h $VALE ] && [ "$(readlink $VALE)" -ef "$FILENAME" ]; then
    :
  else
    log_info "installing $NAME"
    test ! -d "${BINDIR}" && mkdir $BINDIR
    test -e $VALE && rm $VALE
    ln -s ../$FILENAME $VALE
  fi
else
  log_crit "$FILENAME is not available for installation."
  exit 2
fi
