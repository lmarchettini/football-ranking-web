export default function HealthMessages({
  title,
  items,
  type,
}) {
  if (!items?.length) {
    return null;
  }

  const icon =
    type === "strength" ? "✓" : "!";

  return (
    <section
      className={`health-feedback health-feedback--${type}`}
    >
      <div className="health-feedback__header">
        <span className="health-feedback__icon">
          {icon}
        </span>

        <h3>{title}</h3>
      </div>

      <div className="health-feedback__list">
        {items.map((item, index) => (
          <div
            className="health-feedback__item"
            key={`${type}-${index}`}
          >
            <span>{icon}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}