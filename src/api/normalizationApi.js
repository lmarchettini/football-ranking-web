import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_NORMALIZER_API_URL ||
    "http://localhost:8082",

  timeout: 300000,

  headers: {
    "Content-Type": "application/json",
  },
});

export async function normalizeData({
  batchSize,
}) {
  const response = await api.post(
    "/api/v1/normalization/run",
    {
      normalizeData: true,
      normalizeStatistics: false,
      batchSize,
      statisticsBatchSize: 100,
    },
  );

  return response.data;
}

export async function normalizeStatistics({
  statisticsBatchSize,
}) {
  const response = await api.post(
    "/api/v1/normalization/run",
    {
      normalizeData: false,
      normalizeStatistics: true,
      batchSize: 500,
      statisticsBatchSize,
    },
  );

  return response.data;
}