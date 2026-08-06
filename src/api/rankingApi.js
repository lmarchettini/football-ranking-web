import axios from "axios";
import {
  apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
  baseURL: apiUrl(
    "RANKING_API_URL",
    "VITE_RANKING_API_URL",
    "http://localhost:8087",
  ),
  timeout: 180000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function generateHistoricalRanking(request) {
  const response = await api.post(
    "/api/v1/rankings/weekly",
    request,
  );

  return response.data;
}

export async function getRankingBacktest(runId) {
  const response = await api.get(
    `/api/v1/rankings/${runId}/backtest`,
  );

  return response.data;
}

export async function generateHistoricalRankingBatch({
  from,
  to,
  limit,
  mode,
  replaceExisting,
}) {
  const response = await api.post(
    "/api/v1/rankings/weekly/batch",
    {
      from,
      to,
      limit,
      mode,
      replaceExisting,
    },
  );

  return response.data;
}