import { useMemo, useState } from "react";

import {
    ingestFixtures,
    ingestOdds,
    ingestStandings,
    ingestStatistics,
} from "../api/ingestionApi";

const AVAILABLE_LEAGUES = [
    {
        id: 39,
        name: "Premier League",
        country: "Inghilterra",
    },
    {
        id: 40,
        name: "Championship",
        country: "Inghilterra",
    },
    {
        id: 61,
        name: "Ligue 1",
        country: "Francia",
    },
    {
        id: 78,
        name: "Bundesliga",
        country: "Germania",
    },
    {
        id: 88,
        name: "Eredivisie",
        country: "Paesi Bassi",
    },
    {
        id: 94,
        name: "Primeira Liga",
        country: "Portogallo",
    },
    {
        id: 135,
        name: "Serie A",
        country: "Italia",
    },
    {
        id: 136,
        name: "Serie B",
        country: "Italia",
    },
    {
        id: 140,
        name: "LaLiga",
        country: "Spagna",
    },
    {
        id: 144,
        name: "Belgian Pro League",
        country: "Belgio",
    },
    {
        id: 179,
        name: "Scottish Premiership",
        country: "Scozia",
    },
    {
        id: 203,
        name: "Süper Lig",
        country: "Turchia",
    },
];

const ALL_LEAGUE_IDS =
    AVAILABLE_LEAGUES.map(
        (league) => league.id,
    );

const OPERATIONS = {
    fixtures: {
        title: "Fixtures",
        description:
            "Aggiorna calendario, date, stati e risultati delle partite.",
        buttonLabel: "Importa fixtures",
    },

    standings: {
        title: "Standings",
        description:
            "Aggiorna le classifiche delle leghe selezionate.",
        buttonLabel: "Importa standings",
    },

    statistics: {
        title: "Fixture Statistics",
        description:
            "Scarica le statistiche mancanti delle partite concluse.",
        buttonLabel: "Importa statistiche",
    },

    odds: {
        title: "Pre-match Odds",
        description:
            "Scarica le quote disponibili per i mercati BettingBrain.",
        buttonLabel: "Importa odds",
    },
};

function readApiError(error) {
    const responseData =
        error?.response?.data;

    if (typeof responseData === "string") {
        return responseData;
    }

    if (responseData?.message) {
        return responseData.message;
    }

    if (responseData?.error) {
        return responseData.error;
    }

    if (error?.code === "ECONNABORTED") {
        return "La richiesta ha superato il tempo massimo previsto.";
    }

    if (error?.message === "Network Error") {
        return (
            "Impossibile contattare l'Ingestion Service. " +
            "Verifica che sia avviato sulla porta 8081 e che il CORS sia configurato."
        );
    }

    return (
        error?.message ||
        "Errore imprevisto durante l'importazione."
    );
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "it-IT",
        {
            dateStyle: "short",
            timeStyle: "medium",
        },
    ).format(
        new Date(value),
    );
}

function calculateDuration(result) {
    if (
        !result?.startedAt ||
        !result?.completedAt
    ) {
        return null;
    }

    const milliseconds =
        new Date(result.completedAt) -
        new Date(result.startedAt);

    if (
        !Number.isFinite(milliseconds) ||
        milliseconds < 0
    ) {
        return null;
    }

    return (
        milliseconds / 1000
    ).toFixed(1);
}

function ResultSummary({ result }) {
    if (!result) {
        return null;
    }

    const duration =
        calculateDuration(result);

    const statusClass =
        result.status === "COMPLETED"
            ? "ingestion-result--success"
            : result.status ===
                "PARTIAL_SUCCESS"
                ? "ingestion-result--warning"
                : "ingestion-result--error";

    return (
        <div
            className={`ingestion-result ${statusClass}`}
        >
            <div className="ingestion-result__header">
                <strong>{result.status}</strong>

                <span>
                    {formatDateTime(
                        result.completedAt,
                    )}
                </span>
            </div>

            <div className="ingestion-result__metrics">
                <div>
                    <span>Richiesti</span>
                    <strong>
                        {result.requestedItems ?? 0}
                    </strong>
                </div>

                <div>
                    <span>Completati</span>
                    <strong>
                        {result.successfulItems ?? 0}
                    </strong>
                </div>

                <div>
                    <span>Falliti</span>
                    <strong>
                        {result.failedItems ?? 0}
                    </strong>
                </div>

                <div>
                    <span>Durata</span>
                    <strong>
                        {duration
                            ? `${duration}s`
                            : "—"}
                    </strong>
                </div>
            </div>

            {result.errors?.length > 0 && (
                <div className="ingestion-result__errors">
                    {result.errors.map(
                        (error, index) => (
                            <div key={`${error}-${index}`}>
                                {error}
                            </div>
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

export default function DataIngestionPage() {
    const [season, setSeason] =
        useState(2026);

    const [selectedLeagueIds, setSelectedLeagueIds] =
        useState(ALL_LEAGUE_IDS);

    const [statisticsBatchSize, setStatisticsBatchSize] =
        useState(100);

    const [runningOperation, setRunningOperation] =
        useState(null);

    const [results, setResults] =
        useState({});

    const [error, setError] =
        useState("");

    const allSelected =
        selectedLeagueIds.length ===
        AVAILABLE_LEAGUES.length;

    const selectedLeagueSet =
        useMemo(
            () =>
                new Set(
                    selectedLeagueIds,
                ),
            [selectedLeagueIds],
        );

    function toggleLeague(leagueId) {
        setSelectedLeagueIds(
            (current) =>
                current.includes(leagueId)
                    ? current.filter(
                        (id) => id !== leagueId,
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

    function validateLeagueOperation() {
        if (!Number.isInteger(Number(season))) {
            throw new Error(
                "Inserisci una stagione valida.",
            );
        }

        if (selectedLeagueIds.length === 0) {
            throw new Error(
                "Seleziona almeno una lega.",
            );
        }
    }

    async function executeOperation(
        operation,
    ) {
        setError("");
        setRunningOperation(operation);

        try {
            let result;

            switch (operation) {
                case "fixtures":
                    validateLeagueOperation();

                    result =
                        await ingestFixtures({
                            season: Number(season),
                            leagueIds:
                                selectedLeagueIds,
                        });
                    break;

                case "standings":
                    validateLeagueOperation();

                    result =
                        await ingestStandings({
                            season: Number(season),
                            leagueIds:
                                selectedLeagueIds,
                        });
                    break;

                case "odds":
                    validateLeagueOperation();

                    result =
                        await ingestOdds({
                            season: Number(season),
                            leagueIds:
                                selectedLeagueIds,
                        });
                    break;

                case "statistics": {
                    const batchSize =
                        Number(
                            statisticsBatchSize,
                        );

                    if (
                        !Number.isInteger(
                            batchSize,
                        ) ||
                        batchSize < 1 ||
                        batchSize > 500
                    ) {
                        throw new Error(
                            "Il batch delle statistiche deve essere compreso tra 1 e 500.",
                        );
                    }

                    result =
                        await ingestStatistics({
                            batchSize,
                        });
                    break;
                }

                default:
                    throw new Error(
                        "Operazione non supportata.",
                    );
            }

            setResults(
                (current) => ({
                    ...current,
                    [operation]: result,
                }),
            );
        } catch (operationError) {
            setError(
                readApiError(
                    operationError,
                ),
            );
        } finally {
            setRunningOperation(null);
        }
    }

    const isRunning =
        runningOperation !== null;

    return (
        <div className="ingestion-page">
            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            <section className="panel">
                <div className="panel__header">
                    <h2>Configurazione importazione</h2>

                    <p>
                        Scegli stagione e campionati da
                        aggiornare. Le statistiche usano
                        invece un batch indipendente.
                    </p>
                </div>

                <div className="ingestion-config">
                    <div className="field ingestion-season-field">
                        <label htmlFor="ingestion-season">
                            Stagione
                        </label>

                        <input
                            id="ingestion-season"
                            type="number"
                            min="2000"
                            max="2100"
                            value={season}
                            disabled={isRunning}
                            onChange={(event) =>
                                setSeason(
                                    event.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="ingestion-selection-summary">
                        <span>Leghe selezionate</span>

                        <strong>
                            {selectedLeagueIds.length}
                            /
                            {AVAILABLE_LEAGUES.length}
                        </strong>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        disabled={isRunning}
                        onClick={toggleAllLeagues}
                    >
                        {allSelected
                            ? "Deseleziona tutte"
                            : "Seleziona tutte"}
                    </button>
                </div>

                <div className="league-selector">
                    {AVAILABLE_LEAGUES.map(
                        (league) => {
                            const checked =
                                selectedLeagueSet.has(
                                    league.id,
                                );

                            return (
                                <label
                                    key={league.id}
                                    className={
                                        checked
                                            ? "league-option league-option--selected"
                                            : "league-option"
                                    }
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={isRunning}
                                        onChange={() =>
                                            toggleLeague(
                                                league.id,
                                            )
                                        }
                                    />

                                    <span className="league-option__check">
                                        {checked ? "✓" : ""}
                                    </span>

                                    <span className="league-option__content">
                                        <strong>
                                            {league.name}
                                        </strong>

                                        <small>
                                            {league.country}
                                            {" · "}
                                            ID {league.id}
                                        </small>
                                    </span>
                                </label>
                            );
                        },
                    )}
                </div>
            </section>

            <section className="ingestion-actions-grid">
                {Object.entries(
                    OPERATIONS,
                ).map(
                    ([
                        operation,
                        configuration,
                    ]) => {
                        const running =
                            runningOperation ===
                            operation;

                        const isStatistics =
                            operation ===
                            "statistics";

                        return (
                            <article
                                key={operation}
                                className="ingestion-card"
                            >
                                <div className="ingestion-card__top">
                                    <span className="section-kicker">
                                        Data source
                                    </span>

                                    <h2>
                                        {configuration.title}
                                    </h2>

                                    <p>
                                        {
                                            configuration.description
                                        }
                                    </p>
                                </div>

                                {isStatistics && (
                                    <div className="field ingestion-card__field">
                                        <label htmlFor="statistics-batch-size">
                                            Dimensione batch
                                        </label>

                                        <input
                                            id="statistics-batch-size"
                                            type="number"
                                            min="1"
                                            max="500"
                                            value={
                                                statisticsBatchSize
                                            }
                                            disabled={isRunning}
                                            onChange={(event) =>
                                                setStatisticsBatchSize(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                )}

                                {!isStatistics && (
                                    <div className="ingestion-card__scope">
                                        <span>Ambito</span>

                                        <strong>
                                            Stagione {season}
                                        </strong>

                                        <small>
                                            {
                                                selectedLeagueIds.length
                                            } leghe
                                        </small>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="primary-button ingestion-card__button"
                                    disabled={isRunning}
                                    onClick={() =>
                                        executeOperation(
                                            operation,
                                        )
                                    }
                                >
                                    {running
                                        ? "Importazione in corso..."
                                        : configuration.buttonLabel}
                                </button>

                                <ResultSummary
                                    result={
                                        results[
                                        operation
                                        ]
                                    }
                                />
                            </article>
                        );
                    },
                )}
            </section>

            {isRunning && (
                <div className="loading-banner">
                    Operazione{" "}
                    <strong>
                        {
                            OPERATIONS[
                                runningOperation
                            ]?.title
                        }
                    </strong>{" "}
                    in esecuzione. Non chiudere la pagina.
                </div>
            )}
        </div>
    );
}