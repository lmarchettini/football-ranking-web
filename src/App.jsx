import { useState } from "react";

import RankingPage from "./pages/RankingPage";
import PerformancePage from "./pages/PerformancePage";

import "./App.css";

export default function App() {
  const [page, setPage] = useState("ranking");

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <div>
            <div className="eyebrow">
              BETTINGBRAIN · ANALYTICS
            </div>

            <h1>
              {page === "ranking"
                ? "Ranking Backtest"
                : "Performance Dashboard"}
            </h1>

            <p>
              {page === "ranking"
                ? "Genera ranking storici e confronta le migliori selezioni con i risultati reali."
                : "Analizza accuracy, mercati, leghe e calibrazione delle ranking run già elaborate."}
            </p>
          </div>

          <nav
            className="main-nav"
            aria-label="Navigazione principale"
          >
            <button
              type="button"
              className={
                page === "ranking"
                  ? "active"
                  : ""
              }
              onClick={() => setPage("ranking")}
            >
              Ranking
            </button>

            <button
              type="button"
              className={
                page === "performance"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("performance")
              }
            >
              Performance
            </button>
          </nav>
        </div>
      </header>

      <main className="content">
        {page === "ranking" ? (
          <RankingPage />
        ) : (
          <PerformancePage />
        )}
      </main>
    </div>
  );
}