import { useEffect, useState } from "react";

const MARKETS = [
  {
    value: "home_win",
    label: "Home Win",
  },
  {
    value: "over15",
    label: "Over 1.5",
  },
  {
    value: "over25",
    label: "Over 2.5",
  },
  {
    value: "under45",
    label: "Under 4.5",
  },
  {
    value: "double_chance_1x",
    label: "Doppia Chance 1X",
  },
  {
    value: "btts",
    label: "BTTS",
  },
];

export default function HealthFilterForm({
  initialValues,
  loading,
  onSubmit,
}) {
  const [market, setMarket] = useState(
    initialValues.market,
  );

  const [modelVersion, setModelVersion] = useState(
    initialValues.modelVersion,
  );

  const [threshold, setThreshold] = useState(
    initialValues.threshold,
  );

  useEffect(() => {
    setMarket(initialValues.market);
    setModelVersion(initialValues.modelVersion);
    setThreshold(initialValues.threshold);
  }, [initialValues]);

  function submit(event) {
    event.preventDefault();

    const parsedThreshold = Number(threshold);

    if (
      Number.isNaN(parsedThreshold) ||
      parsedThreshold < 0 ||
      parsedThreshold > 1
    ) {
      return;
    }

    onSubmit({
      market,
      modelVersion: modelVersion.trim(),
      threshold: parsedThreshold,
    });
  }

  return (
    <form
      className="health-filter-form"
      onSubmit={submit}
    >
      <div className="field">
        <label htmlFor="health-market">
          Mercato
        </label>

        <select
          id="health-market"
          value={market}
          onChange={(event) =>
            setMarket(event.target.value)
          }
          disabled={loading}
        >
          {MARKETS.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="health-model-version">
          Versione modello
        </label>

        <input
          id="health-model-version"
          value={modelVersion}
          onChange={(event) =>
            setModelVersion(event.target.value)
          }
          placeholder="Vuoto = modello attivo"
          disabled={loading}
        />
      </div>

      <div className="field">
        <label htmlFor="health-threshold">
          Soglia probabilità
        </label>

        <input
          id="health-threshold"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={threshold}
          onChange={(event) =>
            setThreshold(event.target.value)
          }
          disabled={loading}
          required
        />
      </div>

      <button
        className="primary-button"
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Analisi in corso..."
          : "Analizza modello"}
      </button>
    </form>
  );
}