#!/bin/sh
# Usage: sh internal/tools/new_license.sh <template-folder> "<Theme Name>"
python3 - "$(dirname "$0")/LICENSE.template.txt" "$1/LICENSE.txt" "$2" <<'PY'
import sys
src, dst, name = sys.argv[1:4]
open(dst, "w").write(open(src).read().replace("{{NAME}}", name))
PY
