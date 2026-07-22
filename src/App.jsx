import { useState } from "react";
import {
  generateHistoricalRanking,
  getRankingBacktest,
} from "./api/rankingApi";
import MetricCard from "./components/MetricCard";
import RankingForm from "./components/RankingForm";
import MarketTable from "./components/MarketTable";
import SelectionTable from "./components/SelectionTable";
import "./App.css";

function overallMetric(report) {
  return {
    correct: report.correctSelections,
    evaluated: report.evaluatedSelections,
    pending: report.pendingSelections,
    accuracy: report.overallAccuracy,
  };
}

export default function App() {
  const [report, setReport] = useState(null);
  const [runId, setRunId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function execute(form) {
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const ranking =
        await generateHistoricalRanking(form);

      const generatedRunId = ranking.runId;

      if (!generatedRunId) {
        throw new Error(
          "Il Ranking Service non ha restituito runId.",
        );
      }

      setRunId(generatedRunId);

      const backtest =
        await getRankingBacktest(generatedRunId);

      setReport(backtest);
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.message ??
        "Errore durante il backtest.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <div className="eyebrow">
            BETTINGBRAIN · RANKING ANALYTICS
          </div>

          <h1>Ranking Backtest</h1>

          <p>
            Valuta l’affidabilità delle migliori selezioni
            prodotte dal Ranking Service.
          </p>
        </div>
      </header>

      <main className="content">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Nuova analisi storica</h2>
              <p>
                Genera una Top 10 storica e confrontala con
                i risultati reali.
              </p>
            </div>
          </div>

          <RankingForm
            loading={loading}
            onSubmit={execute}
          />
        </section>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {runId && (
          <div className="run-info">
            Run ID: <strong>{runId}</strong>
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

            <MarketTable markets={report.markets} />

            <SelectionTable
              selections={report.selections}
            />
          </>
        )}
      </main>
    </div>
  );
}