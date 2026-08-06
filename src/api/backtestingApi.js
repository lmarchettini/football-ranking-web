import axios from "axios";
import {
  apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
  baseURL: apiUrl(
    "BACKTESTING_API_URL",
    "VITE_BACKTESTING_API_URL",
    "http://localhost:8086",
  ),
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

function optionalValue(value) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

export async function getModelHealth({
  market,
  modelVersion,
  threshold,
}) {
  const response = await api.get(
    `/backtests/${encodeURIComponent(market)}/health`,
    {
      params: {
        modelVersion: optionalValue(modelVersion),
        threshold,
      },
    },
  );

  return response.data;
}