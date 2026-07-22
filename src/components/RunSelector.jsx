function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("it-IT").format(
    new Date(`${value}T00:00:00`),
  );
}

export default function RunSelector({
  runs,
  selectedRunId,
  onChange,
  loading,
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Periodo di analisi</h2>

          <p>
            Visualizza le statistiche aggregate oppure
            analizza una singola settimana.
          </p>
        </div>
      </div>

      <div className="run-selector">
        <div className="field">
          <label htmlFor="performance-run">
            Periodo
          </label>

          <select
            id="performance-run"
            value={selectedRunId}
            onChange={(event) =>
              onChange(event.target.value)
            }
            disabled={loading}
          >
            <option value="ALL">
              Tutto il periodo
            </option>

            {runs.map((run) => (
              <option
                key={run.runId}
                value={String(run.runId)}
              >
                Run #{run.runId} ·{" "}
                {formatDate(run.periodFrom)} -{" "}
                {formatDate(run.periodTo)} ·{" "}
                {run.status}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}