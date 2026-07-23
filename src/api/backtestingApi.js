import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_BACKTESTING_API_URL ||
    "http://localhost:8089",
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