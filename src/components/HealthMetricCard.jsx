export default function HealthMetricCard({
  label,
  value,
  description,
  progress,
  accent = "default",
  compact = false,
}) {
  const safeProgress =
    progress == null
      ? null
      : Math.min(
          100,
          Math.max(0, Number(progress)),
        );

  return (
    <article
      className={[
        "health-metric",
        `health-metric--${accent}`,
        compact ? "health-metric--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="health-metric__header">
        <span>{label}</span>
      </div>

      <strong className="health-metric__value">
        {value}
      </strong>

      {safeProgress != null && (
        <div className="health-metric__progress">
          <span
            style={{
              width: `${safeProgress}%`,
            }}
          />
        </div>
      )}

      <p>{description}</p>
    </article>
  );
}