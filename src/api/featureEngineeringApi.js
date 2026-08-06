import axios from "axios";
import {
    apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
    baseURL: apiUrl(
        "FEATURE_ENGINEERING_API_URL",
        "VITE_FEATURE_ENGINEERING_API_URL",
        "http://localhost:8083",
    ),

    /*
     * La generazione delle feature può durare
     * diversi secondi o minuti.
     */
    timeout: 600000,

    headers: {
        "Content-Type": "application/json",
    },
});

export async function runFeatureEngineering({
    settleUpcoming,
    generateTraining,
    generateUpcoming,
    batchSize,
    upcomingDays,
}) {
    const response = await api.post(
        "/api/v1/feature-engineering/run",
        {
            settleUpcoming,
            generateTraining,
            generateUpcoming,
            batchSize,
            upcomingDays,
        },
    );

    return response.data;
}