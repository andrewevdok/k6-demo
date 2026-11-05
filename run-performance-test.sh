#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: ./run-performance-test.sh <SCRIPT_NAME.ts>"
    exit 1
fi

SCRIPT_NAME="$(basename "$1")"
TEST_NAME="${SCRIPT_NAME%.ts}"
TAG_NAME="${TEST_NAME}-$(date +%s)"
TEST_ENV="${TEST_ENV:-dev}"


docker compose run --rm -T \
    -e TEST_ID="$TAG_NAME" \
    -e TEST_NAME="$TEST_NAME" \
    -e TEST_ENV="$TEST_ENV" \
    k6 \
    sh -c '
        set -e
        rm -f /scripts/summary.json
        status=0
        k6 run "/scripts/$1" \
            --tag "test_id=$TEST_ID" \
            --tag "test_name=$TEST_NAME" \
            --tag "env=$TEST_ENV" || status=$?

        if [ -f /scripts/summary.json ]; then
            node /uploader/dist/cli.js /scripts/summary.json
        else
            echo "No summary.json, nothing to upload" >&2
        fi

        exit "$status"
    ' sh "$SCRIPT_NAME"