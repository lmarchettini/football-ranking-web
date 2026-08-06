#!/bin/sh
set -eu
cat > /usr/share/nginx/html/config.js <<CONFIG
window.__APP_CONFIG__ = {
  RANKING_API_URL: "${RANKING_API_URL:-http://localhost:8087}",
  PERFORMANCE_API_URL: "${PERFORMANCE_API_URL:-http://localhost:8088}",
  BACKTESTING_API_URL: "${BACKTESTING_API_URL:-http://localhost:8086}",
  INGESTION_API_URL: "${INGESTION_API_URL:-http://localhost:8081}",
  NORMALIZER_API_URL: "${NORMALIZER_API_URL:-http://localhost:8082}",
  FEATURE_ENGINEERING_API_URL: "${FEATURE_ENGINEERING_API_URL:-http://localhost:8083}",
  GOAL_PROBABILITY_API_URL: "${GOAL_PROBABILITY_API_URL:-http://localhost:8089}",
  MODEL_MANAGEMENT_API_URL: "${MODEL_MANAGEMENT_API_URL:-http://localhost:8084}"
};
CONFIG
