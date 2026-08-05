import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env
            .VITE_MODEL_MANAGEMENT_API_URL ||
        "http://localhost:8084",

    /*
     * Il training può durare diversi minuti.
     */
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