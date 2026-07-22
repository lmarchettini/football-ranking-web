function percentage(value) {
  return `${(Number(value ?? 0) * 100).toFixed(1)}%`;
}

export default function PerformanceMetricCard({
  title,
  metric,
  description,
}) {
  const correct = metric?.correctPredictions ?? 0;
  const settled = metric?.settledPredictions ?? 0;

  const pending = Math.max(
    0,
    (metric?.totalPredictions ?? 0) - settled,
  );

  return (
    <article className="metric-card">
      <div className="metric-card__title">
        {title}
      </div>

      <div className="metric-card__value">
        {percentage(metric?.accuracy)}
      </div>

      <div className="metric-card__fraction">
        {correct}/{settled}
      </div>

      <div className="metric-card__description">
        {description}
      </div>

      {pending > 0 && (
        <div className="metric-card__pending">
          {pending} non definite
        </div>
      )}
    </article>
  );
}