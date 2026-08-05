import { useState } from "react";

import ModelHealthPage from "./pages/ModelHealthPage";
import PerformancePage from "./pages/PerformancePage";
import RankingPage from "./pages/RankingPage";

import DataIngestionPage from "./pages/DataIngestionPage";
import DataNormalizationPage from "./pages/DataNormalizationPage";
import FeatureEngineeringPage from "./pages/FeatureEngineeringPage";
import GoalProbabilityPage from "./pages/GoalProbabilityPage";
import ModelTrainingPage from "./pages/ModelTrainingPage";
import MatchCalendarPage from "./pages/MatchCalendarPage";

import "./App.css";

const PAGE_CONTENT = {
  ranking: {
    title: "Ranking Backtest",
    description:
      "Genera ranking storici e confronta le migliori selezioni con i risultati reali.",
  },
  calendar: {
    title: "Match Calendar",
    description:
      "Consulta le partite dei campionati BettingBrain e pianifica aggiornamenti, quote e ranking.",
  },
  ingestion: {
    title: "Data Ingestion",
    description:
      "Aggiorna fixture, classifiche, statistiche e quote direttamente dai servizi BettingBrain.",
  },
  normalization: {
    title: "Data Normalization",
    description:
      "Trasforma le raw response di API-Football nelle tabelle normalizzate di BettingBrain.",
  },
  featureEngineering: {
    title: "Feature Engineering",
    description:
      "Genera e aggiorna le feature storiche e future utilizzate dai modelli BettingBrain.",
  },
  goalProbability: {
    title: "Goal Probability",
    description:
      "Addestra i modelli Dixon-Coles e genera le probabilità statistiche delle fixture future.",
  },
  modelTraining: {
    title: "Model Training",
    description:
      "Configura e addestra i modelli Machine Learning utilizzati da BettingBrain.",
  },
  performance: {
    title: "Performance Dashboard",
    description:
      "Analizza accuracy, mercati, leghe e calibrazione delle ranking run già elaborate.",
  },
  health: {
    title: "Model Health",
    description:
      "Valuta in un’unica vista calibrazione, lift, copertura e distribuzione delle probabilità.",
  },
};

export default function App() {
  const [page, setPage] = useState("ranking");

  const content = PAGE_CONTENT[page];

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <div>
            <div className="eyebrow">
              BETTINGBRAIN · ANALYTICS
            </div>

            <h1>{content.title}</h1>

            <p>{content.description}</p>
          </div>

          <nav
            className="main-nav"
            aria-label="Navigazione principale"
          >
            {[
              ["ranking", "Ranking"],
              ["calendar", "Match Calendar"],
              ["performance", "Performance"],
              ["health", "Model Health"],
              ["ingestion", "Data Ingestion"],
              ["normalization", "Data Normalization"],
              ["featureEngineering", "Feature Engineering"],
              ["goalProbability", "Goal Probability"],
              ["modelTraining", "Model Training"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  page === value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage(value)
                }
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="content">
        {page === "ranking" && (
          <RankingPage />
        )}

        {page === "calendar" && (
          <MatchCalendarPage />
        )}

        {page === "ingestion" && (
          <DataIngestionPage />
        )}

        {page === "normalization" && (
          <DataNormalizationPage />
        )}

        {page === "featureEngineering" && (
          <FeatureEngineeringPage />
        )}

        {page === "goalProbability" && (
          <GoalProbabilityPage />
        )}

        {page === "modelTraining" && (
          <ModelTrainingPage />
        )}

        {page === "performance" && (
          <PerformancePage />
        )}

        {page === "health" && (
          <ModelHealthPage />
        )}
      </main>
    </div>
  );
}