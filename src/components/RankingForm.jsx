import { useState } from "react";

export default function RankingForm({
  loading,
  progress,
  onSubmit,
}) {
  const [form, setForm] = useState({
    from: "2025-09-01",
    to: "2026-05-31",
    limit: 15,
    mode: "HISTORICAL",
    generationType: "SINGLE_WEEK",
  });

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "limit"
          ? Number(value)
          : value,
    }));
  }

  function submit(event) {
    event.preventDefault();

    onSubmit(form);
  }

  const isBatch =
    form.generationType === "FULL_PERIOD_WEEKLY";

  return (
    <form
      className="ranking-form"
      onSubmit={submit}
    >
      <div className="field">
        <label htmlFor="from">
          Dal
        </label>

        <input
          id="from"
          name="from"
          type="date"
          value={form.from}
          onChange={updateField}
          disabled={loading}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="to">
          Al
        </label>

        <input
          id="to"
          name="to"
          type="date"
          value={form.to}
          onChange={updateField}
          disabled={loading}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="limit">
          Selezioni per settimana
        </label>

        <input
          id="limit"
          name="limit"
          type="number"
          min="1"
          max="50"
          value={form.limit}
          onChange={updateField}
          disabled={loading}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="mode">
          Modalità
        </label>

        <select
          id="mode"
          name="mode"
          value={form.mode}
          onChange={updateField}
          disabled={loading}
          required
        >
          <option value="HISTORICAL">
            Storico
          </option>

          <option value="UPCOMING">
            Prossime partite
          </option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="generationType">
          Tipo elaborazione
        </label>

        <select
          id="generationType"
          name="generationType"
          value={form.generationType}
          onChange={updateField}
          disabled={loading}
          required
        >
          <option value="SINGLE_WEEK">
            Singolo intervallo
          </option>

          <option value="FULL_PERIOD_WEEKLY">
            Tutto il periodo, settimana per settimana
          </option>
        </select>
      </div>

      <button
        type="submit"
        className="primary-button"
        disabled={loading}
      >
        {loading
          ? isBatch
            ? `Settimana ${progress.completed}/${progress.total}`
            : "Elaborazione..."
          : isBatch
            ? "Genera tutte le settimane"
            : "Esegui backtest ranking"}
      </button>
    </form>
  );
}