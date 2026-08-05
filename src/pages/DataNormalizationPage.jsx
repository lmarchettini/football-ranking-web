import { useState } from "react";

import {
  normalizeData,
  normalizeStatistics,
} from "../api/normalizationApi";

const OPERATIONS = {
  data: {
    title: "Raw Data",
    description:
      "Normalizza fixture, standings e odds presenti nella tabella raw.",
    buttonLabel: "Normalizza dati",
  },

  statistics: {
    title: "Fixture Statistics",
    description:
      "Normalizza le statistiche raw delle partite concluse.",
    buttonLabel: "Normalizza statistiche",
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
      "Impossibile contattare il Normalizer Service. " +
      "Verifica che sia avviato sulla porta 8082 e che il CORS sia configurato."
    );
  }

  return (
    error?.message ||
    "Errore imprevisto durante la normalizzazione."
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

function NormalizationResult({
  result,
  operation,
}) {
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

  const processed =
    operation === "data"
      ? result.dataProcessed
      : result.statisticsProcessed;

  const failed =
    operation === "data"
      ? result.dataFailed
      : result.statisticsFailed;

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

      <div className="normalization-result__metrics">
        <div>
          <span>Processati</span>

          <strong>
            {processed ?? 0}
          </strong>
        </div>

        <div>
          <span>Falliti</span>

          <strong>
            {failed ?? 0}
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
              <div
                key={`${error}-${index}`}
              >
                {error}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default function DataNormalizationPage() {
  const [dataBatchSize, setDataBatchSize] =
    useState(500);

  const [
    statisticsBatchSize,
    setStatisticsBatchSize,
  ] = useState(100);

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

  function validateBatchSize(
    value,
    minimum,
    maximum,
    label,
  ) {
    const numericValue =
      Number(value);

    if (
      !Number.isInteger(
        numericValue,
      ) ||
      numericValue < minimum ||
      numericValue > maximum
    ) {
      throw new Error(
        `${label} deve essere compreso tra ${minimum} e ${maximum}.`,
      );
    }

    return numericValue;
  }

  async function executeOperation(
    operation,
  ) {
    setError("");
    setRunningOperation(operation);

    try {
      let result;

      if (operation === "data") {
        const batchSize =
          validateBatchSize(
            dataBatchSize,
            1,
            5000,
            "Il batch dati",
          );

        result =
          await normalizeData({
            batchSize,
          });
      } else if (
        operation === "statistics"
      ) {
        const batchSize =
          validateBatchSize(
            statisticsBatchSize,
            1,
            1000,
            "Il batch statistiche",
          );

        result =
          await normalizeStatistics({
            statisticsBatchSize:
              batchSize,
          });
      } else {
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
            Configurazione normalizzazione
          </h2>

          <p>
            Elabora le raw response presenti nel
            database e aggiorna le tabelle
            normalizzate di BettingBrain.
          </p>
        </div>

        <div className="normalization-info-grid">
          <div className="normalization-info-card">
            <span className="section-kicker">
              Prima fase
            </span>

            <strong>
              Raw Data
            </strong>

            <p>
              Esegui dopo aver importato fixtures,
              standings e odds.
            </p>
          </div>

          <div className="normalization-flow-arrow">
            →
          </div>

          <div className="normalization-info-card">
            <span className="section-kicker">
              Seconda fase
            </span>

            <strong>
              Fixture Statistics
            </strong>

            <p>
              Esegui dopo aver scaricato le
              statistiche delle fixture concluse.
            </p>
          </div>
        </div>
      </section>

      <section className="ingestion-actions-grid">
        <article className="ingestion-card">
          <div className="ingestion-card__top">
            <span className="section-kicker">
              Normalization
            </span>

            <h2>
              {OPERATIONS.data.title}
            </h2>

            <p>
              {
                OPERATIONS.data
                  .description
              }
            </p>
          </div>

          <div className="field ingestion-card__field">
            <label htmlFor="data-normalization-batch">
              Dimensione batch raw
            </label>

            <input
              id="data-normalization-batch"
              type="number"
              min="1"
              max="5000"
              value={dataBatchSize}
              disabled={isRunning}
              onChange={(event) =>
                setDataBatchSize(
                  event.target.value,
                )
              }
            />

            <small className="field-hint">
              Numero massimo di raw response da
              elaborare nella singola esecuzione.
            </small>
          </div>

          <div className="ingestion-card__scope">
            <span>Endpoint elaborati</span>

            <strong>
              Fixtures · Standings · Odds
            </strong>

            <small>
              Solo record con stato PENDING
            </small>
          </div>

          <button
            type="button"
            className="primary-button ingestion-card__button"
            disabled={isRunning}
            onClick={() =>
              executeOperation(
                "data",
              )
            }
          >
            {runningOperation === "data"
              ? "Normalizzazione in corso..."
              : OPERATIONS.data.buttonLabel}
          </button>

          <NormalizationResult
            operation="data"
            result={results.data}
          />
        </article>

        <article className="ingestion-card">
          <div className="ingestion-card__top">
            <span className="section-kicker">
              Normalization
            </span>

            <h2>
              {
                OPERATIONS.statistics
                  .title
              }
            </h2>

            <p>
              {
                OPERATIONS.statistics
                  .description
              }
            </p>
          </div>

          <div className="field ingestion-card__field">
            <label htmlFor="statistics-normalization-batch">
              Dimensione batch statistiche
            </label>

            <input
              id="statistics-normalization-batch"
              type="number"
              min="1"
              max="1000"
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

            <small className="field-hint">
              Numero massimo di raw statistics da
              normalizzare.
            </small>
          </div>

          <div className="ingestion-card__scope">
            <span>Endpoint elaborato</span>

            <strong>
              /fixtures/statistics
            </strong>

            <small>
              Solo record con stato PENDING
            </small>
          </div>

          <button
            type="button"
            className="primary-button ingestion-card__button"
            disabled={isRunning}
            onClick={() =>
              executeOperation(
                "statistics",
              )
            }
          >
            {runningOperation ===
            "statistics"
              ? "Normalizzazione in corso..."
              : OPERATIONS.statistics
                  .buttonLabel}
          </button>

          <NormalizationResult
            operation="statistics"
            result={
              results.statistics
            }
          />
        </article>
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