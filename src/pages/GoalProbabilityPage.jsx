import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getGoalProbabilityDefaults,
  runGoalProbability,
} from "../api/goalProbabilityApi";

const AVAILABLE_LEAGUES = [
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
  AVAILABLE_LEAGUES.map(
    (league) => league.id,
  );

const MODES = {
  FULL: {
    title: "Esecuzione completa",
    description:
      "Riallena i modelli Dixon-Coles per le leghe selezionate e genera le probabilità delle fixture future.",
    buttonLabel:
      "Addestra e genera probabilità",
  },

  GENERATION_ONLY: {
    title: "Solo Aggiorna probabilità",
    description:
      "Utilizza i modelli Dixon-Coles già addestrati per rigenerare le probabilità delle prossime partite, senza eseguire un nuovo training.",
    buttonLabel:
      "Aggiorna probabilità future",
  },
};

const INITIAL_FORM = {
  trainingStartSeason: 2021,
  trainingEndSeason: 2025,
  predictionSeason: 2026,
  upcomingDays: 10,
  modelVersion: "v2_live",
  unknownTeamPolicy: "SKIP",
};

function readApiError(error) {
  const responseData =
    error?.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.error) {
    return responseData.error;
  }

  if (error?.code === "ECONNABORTED") {
    return (
      "Il processo ha superato il tempo massimo previsto."
    );
  }

  if (error?.message === "Network Error") {
    return (
      "Impossibile contattare il Goal Probability Service. " +
      "Verifica che sia avviato sulla porta 8089 e che il CORS sia configurato."
    );
  }

  return (
    error?.message ||
    "Errore durante il processo Dixon-Coles."
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

function formatPercentage(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return `${(
    Number(value) * 100
  ).toFixed(2)}%`;
}

function ResultSummary({ result }) {
  if (!result) {
    return null;
  }

  const statusClass =
    result.status === "COMPLETED"
      ? "ingestion-result--success"
      : "ingestion-result--error";

  return (
    <div
      className={`ingestion-result ${statusClass}`}
    >
      <div className="ingestion-result__header">
        <strong>
          {result.status}
        </strong>

        <span>
          {formatDateTime(
            result.completedAt,
          )}
        </span>
      </div>

      <div className="goal-result__metrics">
        <div>
          <span>Modelli</span>
          <strong>
            {result.trainedModels ?? 0}
          </strong>
        </div>

        <div>
          <span>Fixture</span>
          <strong>
            {result.totalFixtures ?? 0}
          </strong>
        </div>

        <div>
          <span>Generate</span>
          <strong>
            {
              result.generatedProbabilities ??
              0
            }
          </strong>
        </div>

        <div>
          <span>Salvate</span>
          <strong>
            {
              result.savedProbabilities ??
              0
            }
          </strong>
        </div>

        <div>
          <span>Saltate</span>
          <strong>
            {result.skippedFixtures ?? 0}
          </strong>
        </div>

        <div>
          <span>Coverage</span>
          <strong>
            {formatPercentage(
              result.coverage,
            )}
          </strong>
        </div>

        <div>
          <span>Durata</span>
          <strong>
            {result.elapsedSeconds !==
            undefined
              ? `${Number(
                  result.elapsedSeconds,
                ).toFixed(1)}s`
              : "—"}
          </strong>
        </div>
      </div>

      {result.missingModelLeagues
        ?.length > 0 && (
        <div className="ingestion-result__errors">
          Artifact mancanti per le leghe:{" "}
          {result.missingModelLeagues.join(
            ", ",
          )}
        </div>
      )}

      {result.warnings?.length > 0 && (
        <div className="goal-result__warnings">
          {result.warnings.map(
            (warning, index) => (
              <div
                key={`${warning}-${index}`}
              >
                {warning}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default function GoalProbabilityPage() {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [
    selectedLeagueIds,
    setSelectedLeagueIds,
  ] = useState(ALL_LEAGUE_IDS);

  const [loadingDefaults, setLoadingDefaults] =
    useState(true);

  const [runningMode, setRunningMode] =
    useState(null);

  const [results, setResults] =
    useState({});

  const [error, setError] =
    useState("");

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
    AVAILABLE_LEAGUES.length;

  const isRunning =
    runningMode !== null;

  useEffect(() => {
    let active = true;

    async function loadDefaults() {
      try {
        const defaults =
          await getGoalProbabilityDefaults();

        if (!active) {
          return;
        }

        setForm({
          trainingStartSeason:
            defaults.trainingStartSeason,
          trainingEndSeason:
            defaults.trainingEndSeason,
          predictionSeason:
            defaults.predictionSeason,
          upcomingDays:
            defaults.upcomingDays,
          modelVersion:
            defaults.modelVersion,
          unknownTeamPolicy:
            defaults.unknownTeamPolicy,
        });
      } catch (requestError) {
        if (active) {
          setError(
            readApiError(
              requestError,
            ),
          );
        }
      } finally {
        if (active) {
          setLoadingDefaults(false);
        }
      }
    }

    loadDefaults();

    return () => {
      active = false;
    };
  }, []);

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

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

  function validateForm() {
    const trainingStartSeason =
      Number(
        form.trainingStartSeason,
      );

    const trainingEndSeason =
      Number(
        form.trainingEndSeason,
      );

    const predictionSeason =
      Number(
        form.predictionSeason,
      );

    const upcomingDays =
      Number(
        form.upcomingDays,
      );

    if (
      !Number.isInteger(
        trainingStartSeason,
      ) ||
      !Number.isInteger(
        trainingEndSeason,
      ) ||
      trainingStartSeason >
        trainingEndSeason
    ) {
      throw new Error(
        "L'intervallo delle stagioni di training non è valido.",
      );
    }

    if (
      !Number.isInteger(
        predictionSeason,
      ) ||
      predictionSeason <=
        trainingEndSeason
    ) {
      throw new Error(
        "La stagione di prediction deve essere successiva alla stagione finale di training.",
      );
    }

    if (
      !Number.isInteger(
        upcomingDays,
      ) ||
      upcomingDays < 1 ||
      upcomingDays > 30
    ) {
      throw new Error(
        "La finestra upcoming deve essere compresa tra 1 e 30 giorni.",
      );
    }

    if (
      !form.modelVersion
        ?.trim()
    ) {
      throw new Error(
        "Inserisci una versione modello valida.",
      );
    }

    if (
      selectedLeagueIds.length === 0
    ) {
      throw new Error(
        "Seleziona almeno una lega.",
      );
    }

    return {
      trainingStartSeason,
      trainingEndSeason,
      predictionSeason,
      upcomingDays,
    };
  }

  async function executeMode(mode) {
    setError("");
    setRunningMode(mode);

    try {
      const parsed =
        validateForm();

      const result =
        await runGoalProbability({
          mode,
          ...parsed,
          modelVersion:
            form.modelVersion.trim(),
          unknownTeamPolicy:
            form.unknownTeamPolicy,
          leagueIds:
            selectedLeagueIds,
        });

      setResults(
        (current) => ({
          ...current,
          [mode]: result,
        }),
      );
    } catch (requestError) {
      setError(
        readApiError(
          requestError,
        ),
      );
    } finally {
      setRunningMode(null);
    }
  }

  return (
    <div className="ingestion-page">
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loadingDefaults && (
        <div className="loading-banner">
          Caricamento configurazione
          Dixon-Coles...
        </div>
      )}

      <section className="panel">
        <div className="panel__header">
          <h2>
            Configurazione Dixon-Coles
          </h2>

          <p>
            Configura training, stagione live,
            finestra future e leghe da elaborare.
          </p>
        </div>

        <div className="goal-config-grid">
          <div className="field">
            <label htmlFor="gp-training-start">
              Training da
            </label>

            <input
              id="gp-training-start"
              type="number"
              value={
                form.trainingStartSeason
              }
              disabled={
                isRunning ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "trainingStartSeason",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="field">
            <label htmlFor="gp-training-end">
              Training fino a
            </label>

            <input
              id="gp-training-end"
              type="number"
              value={
                form.trainingEndSeason
              }
              disabled={
                isRunning ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "trainingEndSeason",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="field">
            <label htmlFor="gp-prediction-season">
              Prediction season
            </label>

            <input
              id="gp-prediction-season"
              type="number"
              value={
                form.predictionSeason
              }
              disabled={
                isRunning ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "predictionSeason",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="field">
            <label htmlFor="gp-upcoming-days">
              Finestra upcoming
            </label>

            <input
              id="gp-upcoming-days"
              type="number"
              min="1"
              max="30"
              value={
                form.upcomingDays
              }
              disabled={
                isRunning ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "upcomingDays",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="field">
            <label htmlFor="gp-model-version">
              Model version
            </label>

            <input
              id="gp-model-version"
              type="text"
              value={
                form.modelVersion
              }
              disabled={
                isRunning ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "modelVersion",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="field">
            <label htmlFor="gp-unknown-policy">
              Unknown team policy
            </label>

            <select
              id="gp-unknown-policy"
              value={
                form.unknownTeamPolicy
              }
              disabled={
                isRunning ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "unknownTeamPolicy",
                  event.target.value,
                )
              }
            >
              <option value="SKIP">
                Skip
              </option>

              <option value="LEAGUE_AVERAGE">
                League average
              </option>
            </select>
          </div>
        </div>

        <div className="goal-league-header">
          <div>
            <strong>
              Leghe da elaborare
            </strong>

            <span>
              {
                selectedLeagueIds.length
              }/
              {
                AVAILABLE_LEAGUES.length
              } selezionate
            </span>
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

        <div className="goal-league-grid">
          {AVAILABLE_LEAGUES.map(
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
                      ? "goal-league-option goal-league-option--selected"
                      : "goal-league-option"
                  }
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={isRunning}
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

                  <div>
                    <strong>
                      {league.name}
                    </strong>

                    <small>
                      ID {league.id}
                    </small>
                  </div>
                </label>
              );
            },
          )}
        </div>
      </section>

      <section className="goal-mode-grid">
        {Object.entries(
          MODES,
        ).map(
          ([
            mode,
            configuration,
          ]) => (
            <article
              key={mode}
              className={
                mode === "FULL"
                  ? "ingestion-card goal-mode-card goal-mode-card--primary"
                  : "ingestion-card goal-mode-card"
              }
            >
              <div className="ingestion-card__top">
                <span className="section-kicker">
                  Dixon-Coles
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

              <div className="ingestion-card__scope">
                <span>
                  Operazioni
                </span>

                <strong>
                  {mode === "FULL"
                    ? "Training + Generation"
                    : "Solo calcolo probabilità"}
                </strong>

                <small>
                  Versione{" "}
                  {form.modelVersion}
                  {" · "}
                  prossimi{" "}
                  {form.upcomingDays} giorni
                </small>
              </div>

              <button
                type="button"
                className="primary-button ingestion-card__button"
                disabled={
                  isRunning ||
                  loadingDefaults
                }
                onClick={() =>
                  executeMode(mode)
                }
              >
                {runningMode === mode
                  ? "Processo in corso..."
                  : configuration.buttonLabel}
              </button>

              <div className="goal-mode-note">
                    {mode === "FULL" ? (
                        <>
                            <strong>✓ Consigliato dopo il training</strong>
                            <span>
                                Aggiorna il modello Dixon-Coles e genera le
                                probabilità delle prossime partite.
                            </span>
                        </>
                    ) : (
                        <>
                            <strong>⚡ Consigliato durante la settimana</strong>
                            <span>
                                Utilizza i modelli già addestrati e aggiorna
                                soltanto le probabilità delle prossime partite.
                            </span>
                        </>
                    )}
                </div>

              <ResultSummary
                result={
                  results[mode]
                }
              />
            </article>
          ),
        )}
      </section>

      {isRunning && (
        <div className="loading-banner">
          Processo{" "}
          <strong>
            {
              MODES[runningMode]
                ?.title
            }
          </strong>{" "}
          in esecuzione. Non chiudere la pagina.
        </div>
      )}
    </div>
  );
}