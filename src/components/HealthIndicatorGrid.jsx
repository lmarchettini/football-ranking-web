const INDICATOR_CONFIG = {
  sampleSize: {
    label: "Campione",
    description: "Quantità di dati analizzati",
    icon: "DB",
  },
  calibration: {
    label: "Calibrazione",
    description: "Coerenza delle probabilità",
    icon: "%",
  },
  brierSkill: {
    label: "Brier Skill",
    description: "Vantaggio sulla baseline",
    icon: "BS",
  },
  probabilitySpread: {
    label: "Distribuzione",
    description: "Ampiezza delle probabilità",
    icon: "↔",
  },
  highConfidenceCoverage: {
    label: "Alta confidenza",
    description: "Copertura sopra la soglia",
    icon: "▲",
  },
  thresholdLift: {
    label: "Lift",
    description: "Incremento sulla baseline",
    icon: "+",
  },
};

const LEVEL_LABELS = {
  GOOD: "Buono",
  WARNING: "Attenzione",
  POOR: "Debole",
  INSUFFICIENT_DATA: "Dati insufficienti",
};

export default function HealthIndicatorGrid({
  indicators,
}) {
  if (!indicators) {
    return null;
  }

  return (
    <section className="health-indicators">
      {Object.entries(INDICATOR_CONFIG).map(
        ([key, config]) => {
          const level =
            indicators[key] ??
            "INSUFFICIENT_DATA";

          return (
            <article
              key={key}
              className={`health-indicator health-indicator--${level.toLowerCase()}`}
            >
              <div className="health-indicator__icon">
                {config.icon}
              </div>

              <div className="health-indicator__content">
                <span className="health-indicator__label">
                  {config.label}
                </span>

                <span className="health-indicator__description">
                  {config.description}
                </span>
              </div>

              <span className="health-indicator__level">
                {LEVEL_LABELS[level] ?? level}
              </span>
            </article>
          );
        },
      )}
    </section>
  );
}