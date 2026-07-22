import { useState } from "react";

export default function RankingForm({
  loading,
  onSubmit,
}) {
  const [form, setForm] = useState({
    from: "2025-09-01",
    to: "2025-09-30",
    limit: 10,
    mode: "HISTORICAL",
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

  return (
    <form className="ranking-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="from">Dal</label>

        <input
          id="from"
          name="from"
          type="date"
          value={form.from}
          onChange={updateField}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="to">Al</label>

        <input
          id="to"
          name="to"
          type="date"
          value={form.to}
          onChange={updateField}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="limit">Selezioni</label>

        <input
          id="limit"
          name="limit"
          type="number"
          min="1"
          max="50"
          value={form.limit}
          onChange={updateField}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="mode">Modalità</label>

        <select
          id="mode"
          name="mode"
          value={form.mode}
          onChange={updateField}
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

      <button
        type="submit"
        className="primary-button"
        disabled={loading}
      >
        {loading
          ? "Elaborazione..."
          : "Esegui backtest ranking"}
      </button>
    </form>
  );
}