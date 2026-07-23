import { useState } from "react";

import ModelHealthPage from "./pages/ModelHealthPage";
import PerformancePage from "./pages/PerformancePage";
import RankingPage from "./pages/RankingPage";

import "./App.css";

const PAGE_CONTENT = {
  ranking: {
    title: "Ranking Backtest",
    description:
      "Genera ranking storici e confronta le migliori selezioni con i risultati reali.",
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
              ["performance", "Performance"],
              ["health", "Model Health"],
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