import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_NORMALIZER_API_URL ||
        "http://localhost:8082",

    timeout: 30000,
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