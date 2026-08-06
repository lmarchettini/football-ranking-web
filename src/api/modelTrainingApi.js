import axios from "axios";
import {
    apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
    baseURL: apiUrl(
        "MODEL_MANAGEMENT_API_URL",
        "VITE_MODEL_MANAGEMENT_API_URL",
        "http://localhost:8084",
    ),
    timeout: 1800000,

    headers: {
        "Content-Type": "application/json",
    },
});

export async function getTrainingDefaults() {
    const response = await api.get(
        "/api/v1/training/defaults",
    );

    return response.data;
}

export async function runModelTraining(
    request,
) {
    const response = await api.post(
        "/api/v1/training/run",
        request,
    );

    return response.data;
}