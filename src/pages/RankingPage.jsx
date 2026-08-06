

import {
  generateHistoricalRanking,
  getRankingBacktest,
} from "../api/rankingApi";

import {
  useMemo,
  useState,
} from "react";

import BetCreationModal from "../components/BetCreationModal";

import MetricCard from "../components/MetricCard";
import RankingForm from "../components/RankingForm";
import MarketTable from "../components/MarketTable";
import SelectionTable from "../components/SelectionTable";


function overallMetric(report) {
  return {
    correct: report.correctSelections,
    evaluated: report.evaluatedSelections,
    pending: report.pendingSelections,
    accuracy: report.overallAccuracy,
  };
}

function parseLocalDate(value) {
  const [year, month, day] =
    value
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function formatLocalDate(date) {
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

  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() + days,
  );

  return result;
}

function buildWeeklyPeriods(
  from,
  to,
) {
  const periods = [];

  let currentFrom =
    parseLocalDate(from);

  const requestedTo =
    parseLocalDate(to);

  if (currentFrom >= requestedTo) {
    throw new Error(
      "La data finale deve essere successiva alla data iniziale.",
    );
  }

  while (currentFrom < requestedTo) {
    const nextWeek =
      addDays(
        currentFrom,
        7,
      );

    const currentTo =
      nextWeek < requestedTo
        ? nextWeek
        : requestedTo;

    periods.push({
      from:
        formatLocalDate(
          currentFrom,
        ),

      to:
        formatLocalDate(
          currentTo,
        ),
    });

    currentFrom =
      currentTo;
  }

  return periods;
}

function normalizeLiveRanking(ranking) {
  const selections =
    (ranking.selections ?? []).map(
      (selection) => ({
        ...selection,

        match:
          selection.match ??
          [
            selection.homeTeam,
            selection.awayTeam,
          ]
            .filter(Boolean)
            .join(" - "),

        finalResult: null,
        outcome: "PENDING",
      }),
    );

  return {
    ...ranking,

    selections,

    correctSelections: 0,
    incorrectSelections: 0,
    evaluatedSelections: 0,
    pendingSelections: selections.length,
    overallAccuracy: null,

    top3: {
      correct: 0,
      evaluated: 0,
      pending: Math.min(
        selections.length,
        3,
      ),
      accuracy: null,
    },

    top5: {
      correct: 0,
      evaluated: 0,
      pending: Math.min(
        selections.length,
        5,
      ),
      accuracy: null,
    },

    top10: {
      correct: 0,
      evaluated: 0,
      pending: Math.min(
        selections.length,
        10,
      ),
      accuracy: null,
    },

    marketAccuracy: [],
  };
}

export default function RankingPage() {
  const [report, setReport] =
    useState(null);

  const [runId, setRunId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [batchResult, setBatchResult] =
    useState(null);

  const [progress, setProgress] =
    useState({
      completed: 0,
      total: 0,
    });

  const [
    selectedPredictionIds,
    setSelectedPredictionIds,
  ] = useState([]);

  const [
    betModalOpen,
    setBetModalOpen,
  ] = useState(false);

  const [
    betCreatedMessage,
    setBetCreatedMessage,
  ] = useState("");

  const selections =
    report?.selections ?? [];

  const selectedSelections =
    useMemo(() => {
      const selectedIds =
        new Set(
          selectedPredictionIds,
        );

      return selections.filter(
        (selection) =>
          selectedIds.has(
            selection.rankedPredictionId,
          ),
      );
    }, [
      selections,
      selectedPredictionIds,
    ]);

  function handleToggleSelection(
    selection,
  ) {
    const predictionId =
      selection.rankedPredictionId;

    if (!predictionId) {
      return;
    }

    setSelectedPredictionIds(
      (currentIds) => {
        const alreadySelected =
          currentIds.includes(
            predictionId,
          );

        if (alreadySelected) {
          return currentIds.filter(
            (id) =>
              id !== predictionId,
          );
        }

        return [
          ...currentIds,
          predictionId,
        ];
      },
    );

    setBetCreatedMessage("");
  }

  function handleToggleAll(
    selectableSelections,
    shouldSelect,
  ) {
    const selectableIds =
      selectableSelections
        .map(
          (selection) =>
            selection.rankedPredictionId,
        )
        .filter(Boolean);

    setSelectedPredictionIds(
      shouldSelect
        ? selectableIds
        : [],
    );

    setBetCreatedMessage("");
  }

  function handleOpenBetModal() {
    if (
      selectedSelections.length === 0
    ) {
      return;
    }

    setBetModalOpen(true);
    setBetCreatedMessage("");
  }

  function handleCloseBetModal() {
    setBetModalOpen(false);
  }

  function handleBetCreated(
    createdBet,
  ) {
    setBetModalOpen(false);
    setSelectedPredictionIds([]);

    const betTypeLabel =
      createdBet.betType === "MULTIPLE"
        ? "Multipla"
        : "Singola";

    setBetCreatedMessage(
      `${betTypeLabel} creata correttamente con ID ${createdBet.id}.`,
    );
  }

  async function executeSingle(form) {
    const ranking =
      await generateHistoricalRanking({
        from: form.from,
        to: form.to,
        limit: form.limit,
        mode: form.mode,
      });

    const generatedRunId =
      ranking.runId;

    if (!generatedRunId) {
      throw new Error(
        "Il Ranking Service non ha restituito runId.",
      );
    }

    setRunId(
      generatedRunId,
    );

    if (form.mode === "HISTORICAL") {
      const backtest =
        await getRankingBacktest(
          generatedRunId,
        );

      setReport(
        backtest,
      );

      return;
    }

    setReport(
      normalizeLiveRanking(
        ranking,
      ),
    );
  }

  async function executeBatch(form) {
    if (form.mode !== "HISTORICAL") {
      throw new Error(
        "L'elaborazione settimanale multipla è disponibile solo in modalità storica.",
      );
    }

    const periods =
      buildWeeklyPeriods(
        form.from,
        form.to,
      );

    setProgress({
      completed: 0,
      total: periods.length,
    });

    const generatedRuns = [];
    const failedPeriods = [];

    for (
      let index = 0;
      index < periods.length;
      index += 1
    ) {
      const period =
        periods[index];

      try {
        const ranking =
          await generateHistoricalRanking({
            from: period.from,
            to: period.to,
            limit: form.limit,
            mode: form.mode,
          });

        if (!ranking.runId) {
          throw new Error(
            "runId non restituito dal Ranking Service.",
          );
        }

        /*
         * Richiamiamo anche il backtest.
         *
         * Questo valorizza subito i risultati reali
         * della run settimanale.
         */
        await getRankingBacktest(
          ranking.runId,
        );

        generatedRuns.push({
          runId: ranking.runId,
          from: period.from,
          to: period.to,
          selected:
            ranking.selected ??
            ranking.selectedPredictions ??
            null,
        });
      } catch (requestError) {
        failedPeriods.push({
          from: period.from,
          to: period.to,
          message:
            requestError.response
              ?.data
              ?.message ??
            requestError.message ??
            "Errore sconosciuto",
        });
      } finally {
        setProgress({
          completed: index + 1,
          total: periods.length,
        });
      }
    }

    setBatchResult({
      total: periods.length,
      completed:
        generatedRuns.length,
      failed:
        failedPeriods.length,
      runs:
        generatedRuns,
      failures:
        failedPeriods,
    });

    /*
     * Mostriamo come ultima run quella
     * dell'ultima settimana elaborata.
     */
    const lastRun =
      generatedRuns[
      generatedRuns.length - 1
      ];

    if (lastRun) {
      setRunId(
        lastRun.runId,
      );

      const lastBacktest =
        await getRankingBacktest(
          lastRun.runId,
        );

      setReport(
        lastBacktest,
      );
    }
  }

  async function execute(form) {
    setLoading(true);
    setError("");
    setReport(null);
    setRunId("");
    setBatchResult(null);
    setSelectedPredictionIds([]);
    setBetCreatedMessage("");
    setBetModalOpen(false);

    try {
      if (
        form.generationType ===
        "FULL_PERIOD_WEEKLY"
      ) {
        await executeBatch(form);
      } else {
        await executeSingle(form);
      }
    } catch (requestError) {
      const message =
        requestError.response
          ?.data
          ?.message ??
        requestError.message ??
        "Errore durante il backtest.";

      setError(
        message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>
              Nuova analisi storica
            </h2>

            <p>
              Genera una singola classifica oppure
              ricostruisce automaticamente tutte le
              settimane comprese nel periodo.
            </p>
          </div>
        </div>

        <RankingForm
          loading={loading}
          progress={progress}
          onSubmit={execute}
        />
      </section>

      {loading &&
        progress.total > 0 && (
          <section className="panel">
            <div className="batch-progress">
              <div className="batch-progress__header">
                <strong>
                  Elaborazione settimanale
                </strong>

                <span>
                  {progress.completed}
                  {" / "}
                  {progress.total}
                </span>
              </div>

              <progress
                value={progress.completed}
                max={progress.total}
              />

              <p>
                Non chiudere o ricaricare questa pagina
                durante l’elaborazione.
              </p>
            </div>
          </section>
        )}

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {batchResult && (
        <section className="panel">
          <div className="panel__header">
            <h2>
              Elaborazione completata
            </h2>

            <p>
              Settimane elaborate:{" "}
              <strong>
                {batchResult.completed}
              </strong>
              {" su "}
              <strong>
                {batchResult.total}
              </strong>
              .
            </p>
          </div>

          <div className="batch-summary">
            <div>
              <span>
                Run create
              </span>

              <strong>
                {batchResult.completed}
              </strong>
            </div>

            <div>
              <span>
                Errori
              </span>

              <strong>
                {batchResult.failed}
              </strong>
            </div>
          </div>

          {batchResult.failures.length > 0 && (
            <div className="batch-failures">
              <h3>
                Settimane non elaborate
              </h3>

              {batchResult.failures.map(
                (failure) => (
                  <div
                    key={
                      `${failure.from}-${failure.to}`
                    }
                    className="batch-failure"
                  >
                    <strong>
                      {failure.from}
                      {" → "}
                      {failure.to}
                    </strong>

                    <span>
                      {failure.message}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {runId && (
        <div className="run-info">
          Ultima Run ID:{" "}
          <strong>
            {runId}
          </strong>
        </div>
      )}

      {report && (
        <>
          <section className="metrics-grid">
            <MetricCard
              title="Top 3"
              metric={report.top3}
              description="Le tre selezioni più forti"
            />

            <MetricCard
              title="Top 5"
              metric={report.top5}
              description="Le cinque migliori selezioni"
            />

            <MetricCard
              title="Top 10"
              metric={report.top10}
              description="Qualità complessiva della classifica"
            />

            <MetricCard
              title="Overall"
              metric={overallMetric(report)}
              description="Accuracy di tutte le selezioni"
            />
          </section>

          <MarketTable
            markets={report.markets}
          />

          {selections.length > 0 && (
            <div className="official-bet-toolbar">
              <div>
                <span className="eyebrow">
                  Giocate ufficiali
                </span>

                <strong>
                  {
                    selectedSelections.length
                  }{" "}
                  selezioni scelte
                </strong>

                <p>
                  Seleziona uno o più
                  pronostici per creare una
                  singola o una multipla.
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={
                  handleOpenBetModal
                }
                disabled={
                  selectedSelections.length ===
                  0 ||
                  loading
                }
              >
                Crea giocata
                {selectedSelections.length > 0
                  ? ` (${selectedSelections.length})`
                  : ""}
              </button>
            </div>
          )}

          {betCreatedMessage && (
            <div className="form-alert form-alert--success">
              {betCreatedMessage}
            </div>
          )}

          <SelectionTable
            selections={selections}
            selectedPredictionIds={
              selectedPredictionIds
            }
            onToggleSelection={
              handleToggleSelection
            }
            onToggleAll={
              handleToggleAll
            }
            selectionEnabled={
              !loading
            }
          />
        </>
      )}
      <BetCreationModal
        open={betModalOpen}
        selections={
          selectedSelections
        }
        onClose={
          handleCloseBetModal
        }
        onCreated={
          handleBetCreated
        }
      />
    </>
  );
}