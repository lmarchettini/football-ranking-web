const STATUS_CONFIG = {
  HEALTHY: {
    label: "Modello sano",
    description:
      "Il modello presenta prestazioni, calibrazione e copertura complessivamente solide.",
    icon: "✓",
  },
  WARNING: {
    label: "Da monitorare",
    description:
      "Il modello è utilizzabile, ma presenta alcuni aspetti che meritano attenzione.",
    icon: "!",
  },
  CRITICAL: {
    label: "Critico",
    description:
      "Il modello presenta problemi rilevanti e dovrebbe essere analizzato prima dell’utilizzo.",
    icon: "×",
  },
  INSUFFICIENT_DATA: {
    label: "Dati insufficienti",
    description:
      "Non sono disponibili abbastanza dati per effettuare una valutazione attendibile.",
    icon: "?",
  },
};

export default function HealthStatusCard({ health }) {
  const status =
    health?.status ?? "INSUFFICIENT_DATA";

  const config =
    STATUS_CONFIG[status] ??
    STATUS_CONFIG.INSUFFICIENT_DATA;

  return (
    <section
      className={`health-hero health-hero--${status.toLowerCase()}`}
    >
      <div className="health-hero__main">
        <div className="health-hero__icon">
          {config.icon}
        </div>

        <div>
          <span className="health-hero__eyebrow">
            Stato complessivo
          </span>

          <h2>{config.label}</h2>

          <p>{config.description}</p>
        </div>
      </div>

      <div className="health-hero__details">
        <div className="health-hero__detail">
          <span>Mercato</span>
          <strong>{health.market}</strong>
        </div>

        <div className="health-hero__detail">
          <span>Modello</span>
          <strong>
            {health.modelVersion ?? "Attivo"}
          </strong>
        </div>

        <div className="health-hero__detail">
          <span>Stagione</span>
          <strong>{health.season ?? "—"}</strong>
        </div>

        <div className="health-hero__detail">
          <span>Previsioni</span>
          <strong>
            {Number(
              health.totalPredictions ?? 0,
            ).toLocaleString("it-IT")}
          </strong>
        </div>
      </div>
    </section>
  );
}