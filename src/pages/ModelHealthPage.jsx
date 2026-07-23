import { useEffect, useState } from "react";

import { getModelHealth } from "../api/backtestingApi";
import HealthFilterForm from "../components/HealthFilterForm";
import HealthIndicatorGrid from "../components/HealthIndicatorGrid";
import HealthMessages from "../components/HealthMessages";
import HealthMetricCard from "../components/HealthMetricCard";
import HealthStatusCard from "../components/HealthStatusCard";

const DEFAULT_FILTERS = {
  market: "btts",
  modelVersion: "",
  threshold: 0.6,
};

function percentage(value) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function decimal(value, digits = 4) {
  return Number(value ?? 0).toFixed(digits);
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString("it-IT");
}

export default function ModelHealthPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadHealth(nextFilters) {
    setLoading(true);
    setError("");

    try {
      const result = await getModelHealth(nextFilters);

      setHealth(result);
      setFilters(nextFilters);
    } catch (requestError) {
      setHealth(null);

      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        requestError.message ??
        "Errore nel caricamento della salute del modello.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth(DEFAULT_FILTERS);
  }, []);

  const threshold = health?.thresholdAnalysis;
  const calibration = health?.calibration;
  const distribution = health?.probabilityDistribution;

  function downloadHealthReport() {
  if (!health) {
    return;
  }

  const lines = [
    "BETTINGBRAIN - MODEL HEALTH REPORT",
    "===================================",
    "",
    `Data esportazione: ${new Date().toLocaleString("it-IT")}`,
    `Mercato: ${health.market ?? "N/D"}`,
    `Versione modello: ${health.modelVersion ?? "modello attivo"}`,
    `Stagione: ${health.season ?? "N/D"}`,
    `Stato complessivo: ${health.status ?? "N/D"}`,
    `Previsioni totali: ${formatCount(health.totalPredictions)}`,
    "",
    "INDICATORI",
    "----------",
    `Dimensione campione: ${health.indicators?.sampleSize ?? "N/D"}`,
    `Calibrazione: ${health.indicators?.calibration ?? "N/D"}`,
    `Brier skill: ${health.indicators?.brierSkill ?? "N/D"}`,
    `Distribuzione probabilità: ${
      health.indicators?.probabilitySpread ?? "N/D"
    }`,
    `Copertura alta confidenza: ${
      health.indicators?.highConfidenceCoverage ?? "N/D"
    }`,
    `Lift alla soglia: ${health.indicators?.thresholdLift ?? "N/D"}`,
    "",
    "PRESTAZIONI ALLA SOGLIA",
    "-----------------------",
    `Soglia: ${percentage(threshold?.threshold)}`,
    `Previsioni totali: ${formatCount(threshold?.totalPredictions)}`,
    `Previsioni selezionate: ${formatCount(
      threshold?.selectedPredictions,
    )}`,
    `Previsioni corrette: ${formatCount(
      threshold?.correctPredictions,
    )}`,
    `Previsioni errate: ${formatCount(
      threshold?.wrongPredictions,
    )}`,
    `Accuracy: ${percentage(threshold?.accuracy)}`,
    `Copertura: ${percentage(threshold?.coverage)}`,
    `Baseline mercato: ${percentage(threshold?.marketBaseRate)}`,
    `Lift assoluto: ${percentage(threshold?.absoluteLift)}`,
    `Lift relativo: ${percentage(threshold?.relativeLift)}`,
    "",
    "CALIBRAZIONE",
    "-------------",
    `Frequenza reale positiva: ${percentage(
      calibration?.actualPositiveRate,
    )}`,
    `Probabilità media prevista: ${percentage(
      calibration?.averagePredictedProbability,
    )}`,
    `Expected Calibration Error: ${percentage(
      calibration?.expectedCalibrationError,
    )}`,
    `Bias complessivo: ${percentage(
      calibration?.overallCalibrationBias,
    )}`,
    `Brier Score: ${decimal(calibration?.brierScore)}`,
    `Baseline Brier Score: ${decimal(
      calibration?.baselineBrierScore,
    )}`,
    `Brier Skill Score: ${percentage(
      calibration?.brierSkillScore,
    )}`,
    "",
    "DISTRIBUZIONE PROBABILITA",
    "-------------------------",
    `Probabilità minima: ${percentage(
      distribution?.minPredictedProbability,
    )}`,
    `Probabilità massima: ${percentage(
      distribution?.maxPredictedProbability,
    )}`,
    `Range probabilità: ${percentage(
      distribution?.probabilityRange,
    )}`,
    `Copertura fascia centrale 0.40-0.60: ${percentage(
      distribution?.centralProbabilityCoverage,
    )}`,
    `Copertura alta confidenza: ${percentage(
      distribution?.highConfidenceCoverage,
    )}`,
    `Bucket popolati: ${distribution?.populatedBuckets ?? 0}`,
    `Bucket totali: ${distribution?.totalBuckets ?? 0}`,
    "",
    "PUNTI DI FORZA",
    "---------------",
    ...(health.strengths?.length
      ? health.strengths.map(
          (item, index) => `${index + 1}. ${item}`,
        )
      : ["Nessun punto di forza rilevato."]),
    "",
    "ASPETTI DA MONITORARE",
    "---------------------",
    ...(health.warnings?.length
      ? health.warnings.map(
          (item, index) => `${index + 1}. ${item}`,
        )
      : ["Nessun avviso rilevato."]),
    "",
  ];

  const content = lines.join("\n");

  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  const marketName = String(
    health.market ?? "market",
  ).replaceAll(" ", "_");

  const modelName = String(
    health.modelVersion ?? "active",
  ).replaceAll(" ", "_");

  link.href = url;
  link.download =
    `model-health_${marketName}_${modelName}` +
    `_${health.season ?? "season"}.txt`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}


  return (
    <>
      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Diagnostica modello</h2>

            <p>
              Seleziona mercato, versione e soglia per valutare
              qualità, calibrazione, copertura e capacità di
              superare la baseline.
            </p>
          </div>
        </div>

        <HealthFilterForm
          initialValues={filters}
          loading={loading}
          onSubmit={loadHealth}
        />
      </section>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-banner">
          Caricamento diagnostica modello...
        </div>
      )}

      {health && !loading && (
  <div className="health-dashboard">
    <div className="health-toolbar">
  <div>
    <span className="health-toolbar__title">
      Report diagnostico
    </span>

    <span className="health-toolbar__description">
      Esporta tutte le metriche visualizzate in formato testo.
    </span>
  </div>

  <button
    type="button"
    className="secondary-button"
    onClick={downloadHealthReport}
  >
    Scarica report TXT
  </button>
</div>

    <HealthStatusCard health={health} />

    <HealthIndicatorGrid
      indicators={health.indicators}
    />

    <section className="health-dashboard-section">
      <div className="health-dashboard-section__header">
        <div>
          <span className="section-kicker">
            Selezioni
          </span>

          <h2>Prestazioni alla soglia</h2>

          <p>
            Analisi delle previsioni con probabilità
            almeno pari a{" "}
            <strong>
              {percentage(
                threshold?.threshold,
              )}
            </strong>
            .
          </p>
        </div>

        <div className="section-summary">
          <span>Selezionate</span>

          <strong>
            {formatCount(
              threshold?.selectedPredictions,
            )}
          </strong>

          <small>
            su{" "}
            {formatCount(
              threshold?.totalPredictions,
            )}
          </small>
        </div>
      </div>

      <div className="health-metrics-grid">
        <HealthMetricCard
          label="Accuracy"
          value={percentage(
            threshold?.accuracy,
          )}
          progress={
            Number(
              threshold?.accuracy ?? 0,
            ) * 100
          }
          accent="primary"
          description={`${formatCount(
            threshold?.correctPredictions,
          )} corrette e ${formatCount(
            threshold?.wrongPredictions,
          )} errate`}
        />

        <HealthMetricCard
          label="Copertura"
          value={percentage(
            threshold?.coverage,
          )}
          progress={
            Number(
              threshold?.coverage ?? 0,
            ) * 100
          }
          accent="info"
          description={`${formatCount(
            threshold?.selectedPredictions,
          )} previsioni sopra la soglia`}
        />

        <HealthMetricCard
          label="Lift assoluto"
          value={`+${percentage(
            threshold?.absoluteLift,
          )}`}
          progress={
            Number(
              threshold?.absoluteLift ?? 0,
            ) * 100
          }
          accent="success"
          description={`Baseline mercato ${percentage(
            threshold?.marketBaseRate,
          )}`}
        />

        <HealthMetricCard
          label="Lift relativo"
          value={`+${percentage(
            threshold?.relativeLift,
          )}`}
          accent="success"
          description="Miglioramento relativo rispetto alla baseline"
        />
      </div>
    </section>

    <section className="health-dashboard-section">
      <div className="health-dashboard-section__header">
        <div>
          <span className="section-kicker">
            Affidabilità
          </span>

          <h2>Calibrazione probabilistica</h2>

          <p>
            Quanto le probabilità previste
            corrispondono agli eventi realmente
            osservati.
          </p>
        </div>

        <div className="section-summary">
          <span>Frequenza reale</span>

          <strong>
            {percentage(
              calibration?.actualPositiveRate,
            )}
          </strong>

          <small>
            prevista{" "}
            {percentage(
              calibration?.averagePredictedProbability,
            )}
          </small>
        </div>
      </div>

      <div className="health-metrics-grid">
        <HealthMetricCard
          label="Errore calibrazione"
          value={percentage(
            calibration?.expectedCalibrationError,
          )}
          progress={
            Number(
              calibration?.expectedCalibrationError ??
                0,
            ) * 100
          }
          accent="warning"
          description="ECE pesato su tutti i bucket"
        />

        <HealthMetricCard
          label="Bias complessivo"
          value={percentage(
            calibration?.overallCalibrationBias,
          )}
          accent={
            Number(
              calibration?.overallCalibrationBias ??
                0,
            ) >= 0
              ? "info"
              : "warning"
          }
          description={
            Number(
              calibration?.overallCalibrationBias ??
                0,
            ) >= 0
              ? "Il modello tende a sottostimare"
              : "Il modello tende a sovrastimare"
          }
        />

        <HealthMetricCard
          label="Brier Score"
          value={decimal(
            calibration?.brierScore,
          )}
          accent="default"
          description={`Baseline ${decimal(
            calibration?.baselineBrierScore,
          )}`}
        />

        <HealthMetricCard
          label="Brier Skill"
          value={percentage(
            calibration?.brierSkillScore,
          )}
          progress={
            Number(
              calibration?.brierSkillScore ?? 0,
            ) * 100
          }
          accent="success"
          description="Miglioramento sulla previsione costante"
        />
      </div>
    </section>

    <section className="health-dashboard-section">
      <div className="health-dashboard-section__header">
        <div>
          <span className="section-kicker">
            Confidenza
          </span>

          <h2>
            Distribuzione delle probabilità
          </h2>

          <p>
            Analisi dell’ampiezza e della
            concentrazione delle probabilità
            prodotte.
          </p>
        </div>

        <div className="section-summary">
          <span>Bucket popolati</span>

          <strong>
            {distribution?.populatedBuckets ??
              0}
          </strong>

          <small>
            su{" "}
            {distribution?.totalBuckets ?? 0}
          </small>
        </div>
      </div>

      <div className="probability-range">
        <div className="probability-range__labels">
          <span>
            Min{" "}
            <strong>
              {percentage(
                distribution?.minPredictedProbability,
              )}
            </strong>
          </span>

          <span>
            Max{" "}
            <strong>
              {percentage(
                distribution?.maxPredictedProbability,
              )}
            </strong>
          </span>
        </div>

        <div className="probability-range__track">
          <span
            style={{
              left: `${Math.max(
                0,
                Number(
                  distribution?.minPredictedProbability ??
                    0,
                ) * 100,
              )}%`,
              right: `${Math.max(
                0,
                100 -
                  Number(
                    distribution?.maxPredictedProbability ??
                      0,
                  ) *
                    100,
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="health-metrics-grid health-metrics-grid--three">
        <HealthMetricCard
          label="Range probabilità"
          value={percentage(
            distribution?.probabilityRange,
          )}
          progress={
            Number(
              distribution?.probabilityRange ?? 0,
            ) * 100
          }
          accent="primary"
          description="Distanza tra valore minimo e massimo"
        />

        <HealthMetricCard
          label="Fascia centrale"
          value={percentage(
            distribution?.centralProbabilityCoverage,
          )}
          progress={
            Number(
              distribution?.centralProbabilityCoverage ??
                0,
            ) * 100
          }
          accent="info"
          description="Previsioni concentrate tra 40% e 60%"
        />

        <HealthMetricCard
          label="Alta confidenza"
          value={percentage(
            distribution?.highConfidenceCoverage,
          )}
          progress={
            Number(
              distribution?.highConfidenceCoverage ??
                0,
            ) * 100
          }
          accent="success"
          description={`Previsioni sopra ${percentage(
            threshold?.threshold,
          )}`}
        />
      </div>
    </section>

    <div className="health-feedback-grid">
      <HealthMessages
        title="Punti di forza"
        items={health.strengths}
        type="strength"
      />

      <HealthMessages
        title="Aspetti da monitorare"
        items={health.warnings}
        type="warning"
      />
    </div>
  </div>
)}
    </>
  );
}