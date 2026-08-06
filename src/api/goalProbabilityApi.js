import axios from "axios";
import {
  apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
  baseURL: apiUrl(
    "GOAL_PROBABILITY_API_URL",
    "VITE_GOAL_PROBABILITY_API_URL",
    "http://localhost:8089",
  ),

  /*
   * Il training Dixon-Coles può richiedere
   * più tempo delle normali API.
   */
  timeout: 900000,

  headers: {
    "Content-Type": "application/json",
  },
});

export async function getGoalProbabilityDefaults() {
  const response = await api.get(
    "/api/v1/goal-probability/defaults",
  );

  return response.data;
}

export async function runGoalProbability({
  mode,
  trainingStartSeason,
  trainingEndSeason,
  predictionSeason,
  upcomingDays,
  modelVersion,
  unknownTeamPolicy,
  leagueIds,
}) {
  const response = await api.post(
    "/api/v1/goal-probability/run",
    {
      mode,
      trainingStartSeason,
      trainingEndSeason,
      predictionSeason,
      upcomingDays,
      modelVersion,
      unknownTeamPolicy,
      leagueIds,
    },
  );

  return response.data;
}