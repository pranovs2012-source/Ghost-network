#!/bin/sh
# Usage: sh internal/tools/new_license.sh <template-folder> "<Theme Name>"
sed "s/{{NAME}}/$2/" "$(dirname "$0")/LICENSE.template.txt" > "$1/LICENSE.txt"
