import axios from "axios";
import {
  apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
  baseURL: apiUrl(
    "INGESTION_API_URL",
    "VITE_INGESTION_API_URL",
    "http://localhost:8081",
  ),
  timeout: 300000,

  headers: {
    "Content-Type": "application/json",
  },
});

export async function ingestFixtures({
  season,
  leagueIds,
}) {
  const response = await api.post(
    "/api/v1/ingestion/fixtures",
    {
      season,
      leagueIds,
    },
  );

  return response.data;
}

export async function ingestStandings({
  season,
  leagueIds,
}) {
  const response = await api.post(
    "/api/v1/ingestion/standings",
    {
      season,
      leagueIds,
    },
  );

  return response.data;
}

export async function ingestOdds({
  season,
  leagueIds,
}) {
  const response = await api.post(
    "/api/v1/ingestion/odds",
    {
      season,
      leagueIds,
    },
  );

  return response.data;
}

export async function ingestStatistics({
  batchSize,
}) {
  const response = await api.post(
    "/api/v1/ingestion/statistics",
    {
      batchSize,
    },
  );

  return response.data;
}