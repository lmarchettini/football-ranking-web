import axios from "axios";
import {
  apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
  baseURL: apiUrl(
    "PERFORMANCE_API_URL",
    "VITE_PERFORMANCE_API_URL",
    "http://localhost:8088",
  ),
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

function runParams(runId) {
  if (!runId || runId === "ALL") {
    return {};
  }

  return {
    runId: Number(runId),
  };
}

export async function getPerformanceRuns() {
  const response = await api.get(
    "/api/v1/performance/runs",
  );

  return response.data;
}

export async function getPerformanceSummary(runId) {
  const response = await api.get(
    "/api/v1/performance/summary",
    {
      params: runParams(runId),
    },
  );

  return response.data;
}

export async function getTopNPerformance(
  runId,
  top,
) {
  const response = await api.get(
    "/api/v1/performance/top-n",
    {
      params: {
        ...runParams(runId),
        top,
      },
    },
  );

  return response.data;
}

export async function getMarketPerformance(runId) {
  const response = await api.get(
    "/api/v1/performance/markets",
    {
      params: runParams(runId),
    },
  );

  return response.data;
}

export async function getLeaguePerformance(runId) {
  const response = await api.get(
    "/api/v1/performance/leagues",
    {
      params: runParams(runId),
    },
  );

  return response.data;
}

export async function getScoreBucketPerformance(
  runId,
) {
  const response = await api.get(
    "/api/v1/performance/score-buckets",
    {
      params: runParams(runId),
    },
  );

  return response.data;
}