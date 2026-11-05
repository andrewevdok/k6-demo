#!/bin/sh
set -eu

influx bucket create \
  --name k6_summaries \
  --org "$DOCKER_INFLUXDB_INIT_ORG" \
  --retention 0

influx bucket create \
  --name perf_baselines \
  --org "$DOCKER_INFLUXDB_INIT_ORG" \
  --retention 0
