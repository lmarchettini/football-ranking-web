function percentage(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${(Number(value) * 100).toFixed(1)}%`;
}

export default function MetricCard({
  title,
  metric,
  description,
}) {
  return (
    <article className="metric-card">
      <div className="metric-card__title">{title}</div>

      <div className="metric-card__value">
        {percentage(metric?.accuracy)}
      </div>

      <div className="metric-card__fraction">
        {metric?.correct ?? 0}/{metric?.evaluated ?? 0}
      </div>

      <div className="metric-card__description">
        {description}
      </div>

      {metric?.pending > 0 && (
        <div className="metric-card__pending">
          {metric.pending} in attesa
        </div>
      )}
    </article>
  );
}