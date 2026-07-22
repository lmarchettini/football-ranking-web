import { useEffect, useState } from "react";

import {
  getLeaguePerformance,
  getMarketPerformance,
  getPerformanceRuns,
  getPerformanceSummary,
  getScoreBucketPerformance,
  getTopNPerformance,
} from "../api/performanceApi";

import PerformanceMetricCard
  from "../components/PerformanceMetricCard";

import PerformanceTable
  from "../components/PerformanceTable";

import RunSelector
  from "../components/RunSelector";

export default function PerformancePage() {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] =
  useState("ALL");

  const [data, setData] = useState(null);

  const [loadingRuns, setLoadingRuns] =
    useState(true);

  const [loadingData, setLoadingData] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
  async function loadRuns() {
    try {
      setError("");

      const result =
        await getPerformanceRuns();

      setRuns(result);
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.message ??
        "Errore nel caricamento delle ranking run.";

      setError(message);
    } finally {
      setLoadingRuns(false);
    }
  }

  loadRuns();
}, []);


  useEffect(() => {

    async function loadPerformance() {
      setLoadingData(true);
      setError("");

      try {
        const [
          summary,
          top3,
          top5,
          top10,
          markets,
          leagues,
          buckets,
        ] = await Promise.all([
          getPerformanceSummary(selectedRunId),
          getTopNPerformance(selectedRunId, 3),
          getTopNPerformance(selectedRunId, 5),
          getTopNPerformance(selectedRunId, 10),
          getMarketPerformance(selectedRunId),
          getLeaguePerformance(selectedRunId),
          getScoreBucketPerformance(selectedRunId),
        ]);

        setData({
          summary,
          top3,
          top5,
          top10,
          markets,
          leagues,
          buckets,
        });
      } catch (requestError) {
        setData(null);

        const message =
          requestError.response?.data?.message ??
          requestError.message ??
          "Errore nel caricamento delle performance.";

        setError(message);
      } finally {
        setLoadingData(false);
      }
    }

    loadPerformance();
  }, [selectedRunId]);

  return (
    <>
      <RunSelector
        runs={runs}
        selectedRunId={selectedRunId}
        onChange={setSelectedRunId}
        loading={loadingRuns || loadingData}
      />

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {(loadingRuns || loadingData) && (
        <div className="loading-banner">
          Caricamento performance...
        </div>
      )}

      {data && !loadingData && (
        <>
          <section className="metrics-grid">
            <PerformanceMetricCard
                title="Top 3"
                metric={data.top3}
                description={
                    selectedRunId === "ALL"
                    ? "Prime 3 selezioni di ogni ranking settimanale"
                    : "Le tre selezioni meglio classificate"
                }
                />

                <PerformanceMetricCard
                title="Top 5"
                metric={data.top5}
                description={
                    selectedRunId === "ALL"
                    ? "Prime 5 selezioni di ogni ranking settimanale"
                    : "Le cinque migliori selezioni"
                }
                />

                <PerformanceMetricCard
                title="Top 10"
                metric={data.top10}
                description={
                    selectedRunId === "ALL"
                    ? "Prime 10 selezioni di ogni ranking settimanale"
                    : "Le prime dieci selezioni"
                }
                />

                <PerformanceMetricCard
                title="Overall"
                metric={data.summary}
                description={
                    selectedRunId === "ALL"
                    ? "Tutte le selezioni di tutte le settimane"
                    : "Risultato complessivo della run"
                }
                />
          </section>

          <PerformanceTable
            title="Performance per mercato"
            description="Accuracy delle selezioni raggruppate per mercato."
            rows={data.markets}
            firstColumnLabel="Mercato"
            firstColumnValue={(row) => row.market}
          />

          <PerformanceTable
            title="Performance per lega"
            description="Confronto dell’affidabilità tra le diverse competizioni."
            rows={data.leagues}
            firstColumnLabel="Lega"
            firstColumnValue={(row) =>
              row.leagueName ||
              `League ${row.leagueId}`
            }
          />

          <PerformanceTable
            title="Calibrazione per score"
            description="Performance delle selezioni nei diversi intervalli di final score."
            rows={data.buckets}
            firstColumnLabel="Score bucket"
            firstColumnValue={(row) => row.bucket}
          />
        </>
      )}
    </>
  );
}