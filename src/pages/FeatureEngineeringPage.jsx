import { useState } from "react";

import {
  runFeatureEngineering,
} from "../api/featureEngineeringApi";

const OPERATIONS = {
  full: {
    title: "Esecuzione completa",
    description:
      "Esegue settlement, feature training e aggiornamento delle feature future.",
    buttonLabel:
      "Esegui feature engineering completo",
  },

  settlement: {
    title: "Settlement",
    description:
      "Completa le feature upcoming delle partite concluse aggiungendo i target reali.",
    buttonLabel:
      "Esegui settlement",
  },

  training: {
    title: "Training Features",
    description:
      "Genera le feature mancanti delle fixture storiche concluse.",
    buttonLabel:
      "Genera feature training",
  },

  upcoming: {
    title: "Upcoming Features",
    description:
      "Crea o aggiorna le feature delle prossime fixture.",
    buttonLabel:
      "Genera feature future",
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
    return (
      "La richiesta ha superato il tempo massimo previsto."
    );
  }

  if (error?.message === "Network Error") {
    return (
      "Impossibile contattare il Feature Engineering Service. " +
      "Verifica che sia avviato sulla porta 8083 e che il CORS sia configurato."
    );
  }

  return (
    error?.message ||
    "Errore imprevisto durante il feature engineering."
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

      <div className="feature-result__metrics">
        <div>
          <span>Settled</span>

          <strong>
            {result.settledFeatures ?? 0}
          </strong>
        </div>

        <div>
          <span>Training</span>

          <strong>
            {
              result.generatedTrainingFeatures ??
              0
            }
          </strong>
        </div>

        <div>
          <span>Upcoming</span>

          <strong>
            {
              result.generatedUpcomingFeatures ??
              0
            }
          </strong>
        </div>

        <div>
          <span>Falliti</span>

          <strong>
            {result.failedFeatures ?? 0}
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
            (item, index) => (
              <div
                key={`${item}-${index}`}
              >
                {item}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function buildRequest(
  operation,
  batchSize,
  upcomingDays,
) {
  switch (operation) {
    case "full":
      return {
        settleUpcoming: true,
        generateTraining: true,
        generateUpcoming: true,
        batchSize,
        upcomingDays,
      };

    case "settlement":
      return {
        settleUpcoming: true,
        generateTraining: false,
        generateUpcoming: false,
        batchSize,
        upcomingDays,
      };

    case "training":
      return {
        settleUpcoming: false,
        generateTraining: true,
        generateUpcoming: false,
        batchSize,
        upcomingDays,
      };

    case "upcoming":
      return {
        settleUpcoming: false,
        generateTraining: false,
        generateUpcoming: true,
        batchSize,
        upcomingDays,
      };

    default:
      throw new Error(
        "Operazione non supportata.",
      );
  }
}

export default function FeatureEngineeringPage() {
  const [batchSize, setBatchSize] =
    useState(500);

  const [upcomingDays, setUpcomingDays] =
    useState(10);

  const [
    runningOperation,
    setRunningOperation,
  ] = useState(null);

  const [results, setResults] =
    useState({});

  const [error, setError] =
    useState("");

  const isRunning =
    runningOperation !== null;

  function validateParameters() {
    const parsedBatchSize =
      Number(batchSize);

    const parsedUpcomingDays =
      Number(upcomingDays);

    if (
      !Number.isInteger(
        parsedBatchSize,
      ) ||
      parsedBatchSize < 1 ||
      parsedBatchSize > 5000
    ) {
      throw new Error(
        "Il batch deve essere compreso tra 1 e 5000.",
      );
    }

    if (
      !Number.isInteger(
        parsedUpcomingDays,
      ) ||
      parsedUpcomingDays < 1 ||
      parsedUpcomingDays > 30
    ) {
      throw new Error(
        "La finestra upcoming deve essere compresa tra 1 e 30 giorni.",
      );
    }

    return {
      parsedBatchSize,
      parsedUpcomingDays,
    };
  }

  async function executeOperation(
    operation,
  ) {
    setError("");
    setRunningOperation(operation);

    try {
      const {
        parsedBatchSize,
        parsedUpcomingDays,
      } = validateParameters();

      const request =
        buildRequest(
          operation,
          parsedBatchSize,
          parsedUpcomingDays,
        );

      const result =
        await runFeatureEngineering(
          request,
        );

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

  return (
    <div className="ingestion-page">
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <section className="panel">
        <div className="panel__header">
          <h2>
            Configurazione feature engineering
          </h2>

          <p>
            Costruisce e aggiorna le feature
            utilizzate dai modelli ML e dal
            Ranking Service.
          </p>
        </div>

        <div className="feature-config-grid">
          <div className="field">
            <label htmlFor="feature-batch-size">
              Dimensione batch
            </label>

            <input
              id="feature-batch-size"
              type="number"
              min="1"
              max="5000"
              value={batchSize}
              disabled={isRunning}
              onChange={(event) =>
                setBatchSize(
                  event.target.value,
                )
              }
            />

            <small className="field-hint">
              Numero massimo di fixture per ogni
              fase.
            </small>
          </div>

          <div className="field">
            <label htmlFor="feature-upcoming-days">
              Finestra upcoming
            </label>

            <input
              id="feature-upcoming-days"
              type="number"
              min="1"
              max="30"
              value={upcomingDays}
              disabled={isRunning}
              onChange={(event) =>
                setUpcomingDays(
                  event.target.value,
                )
              }
            />

            <small className="field-hint">
              Giorni futuri per cui generare o
              aggiornare le feature.
            </small>
          </div>

          <div className="feature-config-summary">
            <span>
              Configurazione corrente
            </span>

            <strong>
              {batchSize} fixture
            </strong>

            <small>
              Prossimi {upcomingDays} giorni
            </small>
          </div>
        </div>
      </section>

      <section className="feature-flow">
        <div className="feature-flow__step">
          <span>1</span>

          <div>
            <strong>Settlement</strong>

            <small>
              Converte le feature upcoming
              concluse in dati trainable.
            </small>
          </div>
        </div>

        <div className="feature-flow__arrow">
          →
        </div>

        <div className="feature-flow__step">
          <span>2</span>

          <div>
            <strong>
              Training Features
            </strong>

            <small>
              Genera le feature storiche
              mancanti.
            </small>
          </div>
        </div>

        <div className="feature-flow__arrow">
          →
        </div>

        <div className="feature-flow__step">
          <span>3</span>

          <div>
            <strong>
              Upcoming Features
            </strong>

            <small>
              Aggiorna le fixture future usate
              dal ranking.
            </small>
          </div>
        </div>
      </section>

      <section className="feature-actions-grid">
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

            return (
              <article
                key={operation}
                className={
                  operation === "full"
                    ? "ingestion-card feature-card feature-card--primary"
                    : "ingestion-card feature-card"
                }
              >
                <div className="ingestion-card__top">
                  <span className="section-kicker">
                    Feature Engineering
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
                    Configurazione
                  </span>

                  <strong>
                    Batch {batchSize}
                  </strong>

                  <small>
                    Finestra upcoming:{" "}
                    {upcomingDays} giorni
                  </small>
                </div>

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
                    ? "Elaborazione in corso..."
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