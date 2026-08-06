import axios from "axios";
import {
    apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
    baseURL: apiUrl(
        "NORMALIZER_API_URL",
        "VITE_NORMALIZER_API_URL",
        "http://localhost:8082",
    ),
});

export async function getFixtureCalendar({
    from,
    to,
    leagueIds,
    statuses,
}) {
    const response = await api.get(
        "/api/v1/fixtures/calendar",
        {
            params: {
                from,
                to,

                leagueIds:
                    leagueIds?.length > 0
                        ? leagueIds.join(",")
                        : undefined,

                status:
                    statuses?.length > 0
                        ? statuses.join(",")
                        : undefined,
            },
        },
    );

    return response.data;
}