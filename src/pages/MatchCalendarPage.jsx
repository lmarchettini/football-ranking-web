import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getFixtureCalendar,
} from "../api/fixtureCalendarApi";

const LEAGUES = [
    { id: 39, name: "Premier League" },
    { id: 40, name: "Championship" },
    { id: 61, name: "Ligue 1" },
    { id: 78, name: "Bundesliga" },
    { id: 88, name: "Eredivisie" },
    { id: 94, name: "Primeira Liga" },
    { id: 135, name: "Serie A" },
    { id: 136, name: "Serie B" },
    { id: 140, name: "LaLiga" },
    { id: 144, name: "Belgian Pro League" },
    { id: 179, name: "Scottish Premiership" },
    { id: 203, name: "Süper Lig" },
];

const ALL_LEAGUE_IDS =
    LEAGUES.map(
        (league) => league.id,
    );

const STATUS_OPTIONS = [
    {
        value: "",
        label: "Tutti gli stati",
    },
    {
        value: "NS",
        label: "Programmate",
    },
    {
        value: "LIVE",
        label: "In corso",
    },
    {
        value: "FT",
        label: "Terminate",
    },
];

function startOfWeek(date) {
    const result =
        new Date(date);

    result.setHours(
        0,
        0,
        0,
        0,
    );

    const day =
        result.getDay();

    const distanceFromMonday =
        day === 0
            ? -6
            : 1 - day;

    result.setDate(
        result.getDate()
        + distanceFromMonday,
    );

    return result;
}

function addDays(date, days) {
    const result =
        new Date(date);

    result.setDate(
        result.getDate() + days,
    );

    return result;
}

function toLocalDateTimeParameter(date) {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1,
        ).padStart(2, "0");

    const day =
        String(
            date.getDate(),
        ).padStart(2, "0");

    const hours =
        String(
            date.getHours(),
        ).padStart(2, "0");

    const minutes =
        String(
            date.getMinutes(),
        ).padStart(2, "0");

    const seconds =
        String(
            date.getSeconds(),
        ).padStart(2, "0");

    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}:${seconds}`
    );
}

function formatWeekRange(
    from,
    to,
) {
    const endInclusive =
        addDays(to, -1);

    const formatter =
        new Intl.DateTimeFormat(
            "it-IT",
            {
                day: "numeric",
                month: "long",
            },
        );

    return (
        `${formatter.format(from)} – ` +
        `${formatter.format(endInclusive)} ` +
        `${endInclusive.getFullYear()}`
    );
}

function dayKey(value) {
    const date =
        new Date(value);

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1,
        ).padStart(2, "0"),
        String(
            date.getDate(),
        ).padStart(2, "0"),
    ].join("-");
}

function formatDay(date) {
    return new Intl.DateTimeFormat(
        "it-IT",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
        },
    ).format(date);
}

function formatTime(value) {
    return new Intl.DateTimeFormat(
        "it-IT",
        {
            hour: "2-digit",
            minute: "2-digit",
        },
    ).format(
        new Date(value),
    );
}

function readApiError(error) {
    if (
        typeof error?.response?.data ===
        "string"
    ) {
        return error.response.data;
    }

    if (
        error?.response?.data?.message
    ) {
        return error.response.data.message;
    }

    if (error?.message === "Network Error") {
        return (
            "Impossibile contattare il Normalizer Service. " +
            "Verifica che sia avviato sulla porta 8082."
        );
    }

    return (
        error?.message ||
        "Errore durante il caricamento del calendario."
    );
}

function statusLabel(status) {
    switch (status) {
        case "NS":
            return "Programmata";

        case "1H":
        case "HT":
        case "2H":
        case "ET":
        case "P":
        case "LIVE":
            return "In corso";

        case "FT":
        case "AET":
        case "PEN":
        case "AWD":
            return "Terminata";

        case "PST":
            return "Rinviata";

        case "CANC":
            return "Cancellata";

        default:
            return status || "—";
    }
}

export default function MatchCalendarPage() {
    const [
        weekStart,
        setWeekStart,
    ] = useState(
        startOfWeek(
            new Date(),
        ),
    );

    const [
        selectedLeagueIds,
        setSelectedLeagueIds,
    ] = useState(
        ALL_LEAGUE_IDS,
    );

    const [status, setStatus] =
        useState("");

    const [fixtures, setFixtures] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const weekEnd =
        useMemo(
            () =>
                addDays(
                    weekStart,
                    7,
                ),
            [weekStart],
        );

    const selectedLeagueSet =
        useMemo(
            () =>
                new Set(
                    selectedLeagueIds,
                ),
            [selectedLeagueIds],
        );

    const allSelected =
        selectedLeagueIds.length ===
        LEAGUES.length;

    const fixturesByDay =
        useMemo(() => {
            const grouped =
                new Map();

            for (
                let offset = 0;
                offset < 7;
                offset += 1
            ) {
                const date =
                    addDays(
                        weekStart,
                        offset,
                    );

                grouped.set(
                    dayKey(date),
                    {
                        date,
                        fixtures: [],
                    },
                );
            }

            for (const fixture of fixtures) {
                const key =
                    dayKey(
                        fixture.date,
                    );

                if (!grouped.has(key)) {
                    continue;
                }

                grouped
                    .get(key)
                    .fixtures
                    .push(fixture);
            }

            return [
                ...grouped.values(),
            ];
        }, [
            fixtures,
            weekStart,
        ]);

    const activeLeagues =
        useMemo(
            () =>
                new Set(
                    fixtures.map(
                        (fixture) =>
                            fixture.leagueId,
                    ),
                ).size,
            [fixtures],
        );

    useEffect(() => {
        let active = true;

        async function loadCalendar() {
            setLoading(true);
            setError("");

            try {
                const result =
                    await getFixtureCalendar({
                        from:
                            toLocalDateTimeParameter(
                                weekStart,
                            ),

                        to:
                            toLocalDateTimeParameter(
                                weekEnd,
                            ),

                        leagueIds:
                            selectedLeagueIds,

                        statuses:
                            status
                                ? [status]
                                : [],
                    });

                if (active) {
                    setFixtures(
                        Array.isArray(result)
                            ? result
                            : [],
                    );
                }
            } catch (requestError) {
                if (active) {
                    setError(
                        readApiError(
                            requestError,
                        ),
                    );

                    setFixtures([]);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        if (
            selectedLeagueIds.length === 0
        ) {
            setFixtures([]);
            setLoading(false);

            return () => {
                active = false;
            };
        }

        loadCalendar();

        return () => {
            active = false;
        };
    }, [
        weekStart,
        weekEnd,
        selectedLeagueIds,
        status,
    ]);

    function toggleLeague(
        leagueId,
    ) {
        setSelectedLeagueIds(
            (current) =>
                current.includes(leagueId)
                    ? current.filter(
                        (id) =>
                            id !== leagueId,
                    )
                    : [
                        ...current,
                        leagueId,
                    ],
        );
    }

    function toggleAllLeagues() {
        setSelectedLeagueIds(
            allSelected
                ? []
                : ALL_LEAGUE_IDS,
        );
    }

    return (
        <div className="calendar-page">
            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            <section className="panel">
                <div className="calendar-toolbar">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                            setWeekStart(
                                addDays(
                                    weekStart,
                                    -7,
                                ),
                            )
                        }
                    >
                        ← Settimana precedente
                    </button>

                    <div className="calendar-toolbar__period">
                        <span>
                            Calendario settimanale
                        </span>

                        <strong>
                            {formatWeekRange(
                                weekStart,
                                weekEnd,
                            )}
                        </strong>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                            setWeekStart(
                                addDays(
                                    weekStart,
                                    7,
                                ),
                            )
                        }
                    >
                        Settimana successiva →
                    </button>
                </div>

                <div className="calendar-filters">
                    <div className="field">
                        <label htmlFor="calendar-status">
                            Stato
                        </label>

                        <select
                            id="calendar-status"
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value,
                                )
                            }
                        >
                            {STATUS_OPTIONS.map(
                                (option) => (
                                    <option
                                        key={
                                            option.value
                                        }
                                        value={
                                            option.value
                                        }
                                    >
                                        {option.label}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                            setWeekStart(
                                startOfWeek(
                                    new Date(),
                                ),
                            )
                        }
                    >
                        Questa settimana
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={toggleAllLeagues}
                    >
                        {allSelected
                            ? "Deseleziona leghe"
                            : "Seleziona tutte"}
                    </button>
                </div>

                <div className="calendar-league-grid">
                    {LEAGUES.map(
                        (league) => {
                            const selected =
                                selectedLeagueSet.has(
                                    league.id,
                                );

                            return (
                                <label
                                    key={league.id}
                                    className={
                                        selected
                                            ? "calendar-league calendar-league--selected"
                                            : "calendar-league"
                                    }
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() =>
                                            toggleLeague(
                                                league.id,
                                            )
                                        }
                                    />

                                    <span>
                                        {selected
                                            ? "✓"
                                            : ""}
                                    </span>

                                    <strong>
                                        {league.name}
                                    </strong>
                                </label>
                            );
                        },
                    )}
                </div>
            </section>

            <section className="calendar-summary">
                <div>
                    <span>Partite</span>

                    <strong>
                        {fixtures.length}
                    </strong>
                </div>

                <div>
                    <span>
                        Campionati attivi
                    </span>

                    <strong>
                        {activeLeagues}
                    </strong>
                </div>

                <div>
                    <span>
                        Giorni con partite
                    </span>

                    <strong>
                        {
                            fixturesByDay.filter(
                                (item) =>
                                    item.fixtures
                                        .length > 0,
                            ).length
                        }
                    </strong>
                </div>
            </section>

            {loading && (
                <div className="loading-banner">
                    Caricamento calendario...
                </div>
            )}

            {!loading && (
                <section className="calendar-days">
                    {fixturesByDay.map(
                        (day) => (
                            <article
                                key={dayKey(day.date)}
                                className="calendar-day"
                            >
                                <header className="calendar-day__header">
                                    <h2>
                                        {formatDay(
                                            day.date,
                                        )}
                                    </h2>

                                    <span>
                                        {
                                            day.fixtures
                                                .length
                                        }{" "}
                                        partite
                                    </span>
                                </header>

                                {day.fixtures
                                    .length === 0 ? (
                                    <div className="calendar-day__empty">
                                        Nessuna partita
                                    </div>
                                ) : (
                                    <div className="calendar-fixtures">
                                        {day.fixtures.map(
                                            (fixture) => (
                                                <div
                                                    key={
                                                        fixture.fixtureId
                                                    }
                                                    className="calendar-fixture"
                                                >
                                                    <div className="calendar-fixture__time">
                                                        {formatTime(
                                                            fixture.date,
                                                        )}
                                                    </div>

                                                    <div className="calendar-fixture__main">
                                                        <div className="calendar-fixture__league">
                                                            {fixture.leagueLogo && (
                                                                <img
                                                                    src={
                                                                        fixture.leagueLogo
                                                                    }
                                                                    alt=""
                                                                />
                                                            )}

                                                            <span>
                                                                {
                                                                    fixture.leagueName
                                                                }
                                                            </span>

                                                            {fixture.round && (
                                                                <small>
                                                                    {
                                                                        fixture.round
                                                                    }
                                                                </small>
                                                            )}
                                                        </div>

                                                        <div className="calendar-fixture__teams">
                                                            <div>
                                                                {fixture.homeTeamLogo && (
                                                                    <img
                                                                        src={
                                                                            fixture.homeTeamLogo
                                                                        }
                                                                        alt=""
                                                                    />
                                                                )}

                                                                <strong>
                                                                    {
                                                                        fixture.homeTeamName
                                                                    }
                                                                </strong>
                                                            </div>

                                                            <span>
                                                                {fixture.homeGoals !==
                                                                    null &&
                                                                    fixture.homeGoals !==
                                                                    undefined
                                                                    ? `${fixture.homeGoals} - ${fixture.awayGoals}`
                                                                    : "vs"}
                                                            </span>

                                                            <div>
                                                                {fixture.awayTeamLogo && (
                                                                    <img
                                                                        src={
                                                                            fixture.awayTeamLogo
                                                                        }
                                                                        alt=""
                                                                    />
                                                                )}

                                                                <strong>
                                                                    {
                                                                        fixture.awayTeamName
                                                                    }
                                                                </strong>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={
                                                            `calendar-status ` +
                                                            `calendar-status--${(
                                                                fixture.status ||
                                                                "unknown"
                                                            ).toLowerCase()}`
                                                        }
                                                    >
                                                        {statusLabel(
                                                            fixture.status,
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </article>
                        ),
                    )}
                </section>
            )}
        </div>
    );
}