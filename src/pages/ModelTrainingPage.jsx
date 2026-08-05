import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getTrainingDefaults,
  runModelTraining,
} from "../api/modelTrainingApi";

const MARKETS = [
  {
    code: "home_win",
    label: "Home Win",
  },
  {
    code: "btts",
    label: "BTTS",
  },
  {
    code: "over25",
    label: "Over 2.5",
  },
  {
    code: "double_chance_1x",
    label: "Double Chance 1X",
  },
  {
    code: "home_scored",
    label: "Home Team Scores",
  },
  {
    code: "away_scored",
    label: "Away Team Scores",
  },
];

const ALGORITHMS = [
  "XGBoost",
  "RandomForest",
  "ExtraTrees",
  "GradientBoosting",
  "HistGradientBoosting",
  "LogisticRegression",
];

const INITIAL_FORM = {
  trainingMode: "LIVE",

  trainingStartSeason: 2021,
  trainingEndSeason: 2025,
  backtestSeason: 2025,

  modelAlgorithm: "XGBoost",
  modelVersion: "v12_live",

  enabledMarkets: MARKETS.map(
    (market) => market.code,
  ),

  calibratedMarkets: [
    "home_win",
    "double_chance_1x",
  ],

  calibrationSeason: 2025,
  calibrationMethod: "sigmoid",

  xgbValidationSeason: 2025,
  xgbEarlyStoppingRounds: 0,
  xgbNEstimators: 250,
  xgbLearningRate: 0.02,
  xgbMaxDepth: 3,
  xgbMinChildWeight: 8,
  xgbSubsample: 0.8,
  xgbColsampleBytree: 0.7,
  xgbRegAlpha: 0.5,
  xgbRegLambda: 2,
  xgbGamma: 0.1,

  rfNEstimators: 800,
  rfMaxDepth: 8,
  rfMinSamplesLeaf: 5,
  rfClassWeight: "balanced",
};

function readApiError(error) {
  const responseData =
    error?.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (typeof responseData?.detail === "string") {
    return responseData.detail;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.error) {
    return responseData.error;
  }

  if (error?.response?.status === 409) {
    return (
      "Un processo di training è già in esecuzione."
    );
  }

  if (error?.code === "ECONNABORTED") {
    return (
      "Il training ha superato il tempo massimo previsto."
    );
  }

  if (error?.message === "Network Error") {
    return (
      "Impossibile contattare il Model Management Service. " +
      "Verifica che sia avviato sulla porta 8084 e che il CORS sia configurato."
    );
  }

  return (
    error?.message ||
    "Errore durante il training dei modelli."
  );
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "it-IT",
    {
      dateStyle: "short",
      timeStyle: "medium",
    },
  ).format(
    new Date(value),
  );
}

function TrainingResult({ result }) {
  if (!result) {
    return null;
  }

  const success =
    result.status === "COMPLETED";

  return (
    <div
      className={
        success
          ? "training-result training-result--success"
          : "training-result training-result--error"
      }
    >
      <div className="training-result__header">
        <strong>{result.status}</strong>

        <span>
          {formatDateTime(
            result.completedAt,
          )}
        </span>
      </div>

      <div className="training-result__metrics">
        <div>
          <span>Modalità</span>
          <strong>
            {result.trainingMode ?? "—"}
          </strong>
        </div>

        <div>
          <span>Algoritmo</span>
          <strong>
            {result.algorithm ?? "—"}
          </strong>
        </div>

        <div>
          <span>Modelli</span>
          <strong>
            {result.generatedModels ?? 0}
          </strong>
        </div>

        <div>
          <span>Metriche salvate</span>
          <strong>
            {result.savedMetrics ?? 0}
          </strong>
        </div>

        <div>
          <span>Exit code</span>
          <strong>
            {result.exitCode ?? "—"}
          </strong>
        </div>

        <div>
          <span>Durata</span>
          <strong>
            {result.elapsedSeconds !==
            undefined
              ? `${result.elapsedSeconds}s`
              : "—"}
          </strong>
        </div>
      </div>

      {result.errors?.length > 0 && (
        <div className="training-result__errors">
          {result.errors.map(
            (item, index) => (
              <div
                key={`${item}-${index}`}
              >
                {item}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default function ModelTrainingPage() {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [loadingDefaults, setLoadingDefaults] =
    useState(true);

  const [running, setRunning] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");

  const enabledMarketSet =
    useMemo(
      () =>
        new Set(
          form.enabledMarkets,
        ),
      [form.enabledMarkets],
    );

  const calibratedMarketSet =
    useMemo(
      () =>
        new Set(
          form.calibratedMarkets,
        ),
      [form.calibratedMarkets],
    );

  const liveMode =
    form.trainingMode === "LIVE";

  const xgboostSelected =
    form.modelAlgorithm === "XGBoost";

  const randomForestSelected =
    form.modelAlgorithm ===
    "RandomForest";

  useEffect(() => {
    let active = true;

    async function loadDefaults() {
      try {
        const defaults =
          await getTrainingDefaults();

        if (!active) {
          return;
        }

        setForm(
          (current) => ({
            ...current,
            ...defaults,

            enabledMarkets:
              defaults.enabledMarkets ??
              current.enabledMarkets,

            calibratedMarkets:
              defaults.calibratedMarkets ??
              [],
          }),
        );
      } catch (requestError) {
        if (active) {
          setError(
            readApiError(
              requestError,
            ),
          );
        }
      } finally {
        if (active) {
          setLoadingDefaults(false);
        }
      }
    }

    loadDefaults();

    return () => {
      active = false;
    };
  }, []);

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function toggleEnabledMarket(
    marketCode,
  ) {
    setForm(
      (current) => {
        const selected =
          current.enabledMarkets.includes(
            marketCode,
          );

        const enabledMarkets =
          selected
            ? current.enabledMarkets.filter(
                (item) =>
                  item !== marketCode,
              )
            : [
                ...current.enabledMarkets,
                marketCode,
              ];

        /*
         * Un mercato non abilitato non può
         * restare tra quelli calibrati.
         */
        const calibratedMarkets =
          current.calibratedMarkets.filter(
            (item) =>
              enabledMarkets.includes(
                item,
              ),
          );

        return {
          ...current,
          enabledMarkets,
          calibratedMarkets,
        };
      },
    );
  }

  function toggleCalibratedMarket(
    marketCode,
  ) {
    if (
      !form.enabledMarkets.includes(
        marketCode,
      )
    ) {
      return;
    }

    setForm(
      (current) => {
        const selected =
          current.calibratedMarkets.includes(
            marketCode,
          );

        return {
          ...current,
          calibratedMarkets:
            selected
              ? current.calibratedMarkets.filter(
                  (item) =>
                    item !== marketCode,
                )
              : [
                  ...current.calibratedMarkets,
                  marketCode,
                ],
        };
      },
    );
  }

  function parseInteger(
    value,
    label,
    minimum = 0,
  ) {
    const parsed =
      Number(value);

    if (
      !Number.isInteger(parsed) ||
      parsed < minimum
    ) {
      throw new Error(
        `${label} non è valido.`,
      );
    }

    return parsed;
  }

  function parseDecimal(
    value,
    label,
    minimum = 0,
    maximum = null,
  ) {
    const parsed =
      Number(value);

    if (
      !Number.isFinite(parsed) ||
      parsed < minimum ||
      (
        maximum !== null &&
        parsed > maximum
      )
    ) {
      throw new Error(
        `${label} non è valido.`,
      );
    }

    return parsed;
  }

  function buildRequest() {
    const trainingStartSeason =
      parseInteger(
        form.trainingStartSeason,
        "La stagione iniziale",
        2000,
      );

    const trainingEndSeason =
      parseInteger(
        form.trainingEndSeason,
        "La stagione finale",
        2000,
      );

    const backtestSeason =
      parseInteger(
        form.backtestSeason,
        "La stagione di backtest",
        2000,
      );

    if (
      trainingStartSeason >
      trainingEndSeason
    ) {
      throw new Error(
        "La stagione iniziale non può essere successiva a quella finale.",
      );
    }

    if (
      !liveMode &&
      backtestSeason <=
        trainingEndSeason
    ) {
      throw new Error(
        "In modalità EVALUATION il backtest deve essere successivo al training.",
      );
    }

    if (
      form.enabledMarkets.length === 0
    ) {
      throw new Error(
        "Seleziona almeno un mercato.",
      );
    }

    if (
      !form.modelVersion?.trim()
    ) {
      throw new Error(
        "Inserisci una versione modello.",
      );
    }

    return {
      trainingMode:
        form.trainingMode,

      trainingStartSeason,
      trainingEndSeason,
      backtestSeason,

      modelAlgorithm:
        form.modelAlgorithm,

      modelVersion:
        form.modelVersion.trim(),

      enabledMarkets:
        form.enabledMarkets,

      calibratedMarkets:
        form.calibratedMarkets,

      calibrationSeason:
        parseInteger(
          form.calibrationSeason,
          "La stagione di calibrazione",
          2000,
        ),

      calibrationMethod:
        form.calibrationMethod,

      xgbValidationSeason:
        parseInteger(
          form.xgbValidationSeason,
          "La stagione di validazione XGBoost",
          2000,
        ),

      xgbEarlyStoppingRounds:
        parseInteger(
          form.xgbEarlyStoppingRounds,
          "Gli early stopping rounds",
          0,
        ),

      xgbNEstimators:
        parseInteger(
          form.xgbNEstimators,
          "Il numero di estimators XGBoost",
          1,
        ),

      xgbLearningRate:
        parseDecimal(
          form.xgbLearningRate,
          "Il learning rate",
          0.0001,
          1,
        ),

      xgbMaxDepth:
        parseInteger(
          form.xgbMaxDepth,
          "La profondità XGBoost",
          1,
        ),

      xgbMinChildWeight:
        parseDecimal(
          form.xgbMinChildWeight,
          "Il min child weight",
          0,
        ),

      xgbSubsample:
        parseDecimal(
          form.xgbSubsample,
          "Il subsample",
          0,
          1,
        ),

      xgbColsampleBytree:
        parseDecimal(
          form.xgbColsampleBytree,
          "Il colsample by tree",
          0,
          1,
        ),

      xgbRegAlpha:
        parseDecimal(
          form.xgbRegAlpha,
          "Reg alpha",
          0,
        ),

      xgbRegLambda:
        parseDecimal(
          form.xgbRegLambda,
          "Reg lambda",
          0,
        ),

      xgbGamma:
        parseDecimal(
          form.xgbGamma,
          "Gamma",
          0,
        ),

      rfNEstimators:
        parseInteger(
          form.rfNEstimators,
          "Il numero di estimators Random Forest",
          1,
        ),

      rfMaxDepth:
        parseInteger(
          form.rfMaxDepth,
          "La profondità Random Forest",
          1,
        ),

      rfMinSamplesLeaf:
        parseInteger(
          form.rfMinSamplesLeaf,
          "Il numero minimo di sample per foglia",
          1,
        ),

      rfClassWeight:
        form.rfClassWeight,
    };
  }

  async function executeTraining() {
    setError("");
    setResult(null);
    setRunning(true);

    try {
      const request =
        buildRequest();

      const response =
        await runModelTraining(
          request,
        );

      setResult(response);
    } catch (requestError) {
      setError(
        readApiError(
          requestError,
        ),
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="training-page">
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loadingDefaults && (
        <div className="loading-banner">
          Caricamento configurazione training...
        </div>
      )}

      <section className="panel">
        <div className="panel__header">
          <h2>
            Configurazione training
          </h2>

          <p>
            Addestra i modelli ML attraverso il
            Model Management Service e registra
            automaticamente metriche e artifact.
          </p>
        </div>

        <div className="training-base-grid">
          <div className="field">
            <label htmlFor="training-mode">
              Modalità
            </label>

            <select
              id="training-mode"
              value={form.trainingMode}
              disabled={
                running ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "trainingMode",
                  event.target.value,
                )
              }
            >
              <option value="LIVE">
                Live
              </option>

              <option value="EVALUATION">
                Evaluation
              </option>
            </select>

            <small className="field-hint">
              LIVE usa tutto lo storico disponibile;
              EVALUATION mantiene una stagione
              separata per il backtest.
            </small>
          </div>

          <div className="field">
            <label htmlFor="training-algorithm">
              Algoritmo
            </label>

            <select
              id="training-algorithm"
              value={
                form.modelAlgorithm
              }
              disabled={
                running ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "modelAlgorithm",
                  event.target.value,
                )
              }
            >
              {ALGORITHMS.map(
                (algorithm) => (
                  <option
                    key={algorithm}
                    value={algorithm}
                  >
                    {algorithm}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="training-version">
              Model version
            </label>

            <input
              id="training-version"
              type="text"
              value={form.modelVersion}
              disabled={
                running ||
                loadingDefaults
              }
              onChange={(event) =>
                updateField(
                  "modelVersion",
                  event.target.value,
                )
              }
            />
          </div>
        </div>

        <div className="training-season-grid">
          <div className="field">
            <label htmlFor="training-start">
              Training da
            </label>

            <input
              id="training-start"
              type="number"
              value={
                form.trainingStartSeason
              }
              disabled={running}
              onChange={(event) =>
                updateField(
                  "trainingStartSeason",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="field">
            <label htmlFor="training-end">
              Training fino a
            </label>

            <input
              id="training-end"
              type="number"
              value={
                form.trainingEndSeason
              }
              disabled={running}
              onChange={(event) =>
                updateField(
                  "trainingEndSeason",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="field">
            <label htmlFor="backtest-season">
              Backtest season
            </label>

            <input
              id="backtest-season"
              type="number"
              value={
                form.backtestSeason
              }
              disabled={
                running ||
                liveMode
              }
              onChange={(event) =>
                updateField(
                  "backtestSeason",
                  event.target.value,
                )
              }
            />

            {liveMode && (
              <small className="field-hint">
                Ignorata dal Training Service in
                modalità LIVE.
              </small>
            )}
          </div>

          <div className="field">
            <label htmlFor="calibration-season">
              Calibration season
            </label>

            <input
              id="calibration-season"
              type="number"
              value={
                form.calibrationSeason
              }
              disabled={running}
              onChange={(event) =>
                updateField(
                  "calibrationSeason",
                  event.target.value,
                )
              }
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>Mercati</h2>

          <p>
            Seleziona i modelli da addestrare e
            quali mercati sottoporre a
            calibrazione.
          </p>
        </div>

        <div className="training-market-grid">
          {MARKETS.map(
            (market) => {
              const enabled =
                enabledMarketSet.has(
                  market.code,
                );

              const calibrated =
                calibratedMarketSet.has(
                  market.code,
                );

              return (
                <article
                  key={market.code}
                  className={
                    enabled
                      ? "training-market-card training-market-card--enabled"
                      : "training-market-card"
                  }
                >
                  <div className="training-market-card__title">
                    <strong>
                      {market.label}
                    </strong>

                    <small>
                      {market.code}
                    </small>
                  </div>

                  <label className="training-toggle">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={running}
                      onChange={() =>
                        toggleEnabledMarket(
                          market.code,
                        )
                      }
                    />

                    <span>
                      Training
                    </span>
                  </label>

                  <label className="training-toggle">
                    <input
                      type="checkbox"
                      checked={calibrated}
                      disabled={
                        running ||
                        !enabled
                      }
                      onChange={() =>
                        toggleCalibratedMarket(
                          market.code,
                        )
                      }
                    />

                    <span>
                      Calibrazione
                    </span>
                  </label>
                </article>
              );
            },
          )}
        </div>

        <div className="training-calibration-grid">
          <div className="field">
            <label htmlFor="calibration-method">
              Metodo di calibrazione
            </label>

            <select
              id="calibration-method"
              value={
                form.calibrationMethod
              }
              disabled={
                running ||
                form.calibratedMarkets.length ===
                  0
              }
              onChange={(event) =>
                updateField(
                  "calibrationMethod",
                  event.target.value,
                )
              }
            >
              <option value="sigmoid">
                Sigmoid
              </option>

              <option value="isotonic">
                Isotonic
              </option>
            </select>
          </div>

          <div className="training-config-summary">
            <span>Configurazione mercati</span>

            <strong>
              {form.enabledMarkets.length} modelli
            </strong>

            <small>
              {form.calibratedMarkets.length} calibrati
            </small>
          </div>
        </div>
      </section>

      {xgboostSelected && (
        <section className="panel">
          <div className="panel__header">
            <h2>Parametri XGBoost</h2>

            <p>
              Configurazione dell’algoritmo
              principale utilizzato da
              BettingBrain.
            </p>
          </div>

          <div className="training-parameter-grid">
            <div className="field">
              <label>N estimators</label>
              <input
                type="number"
                value={form.xgbNEstimators}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbNEstimators",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Learning rate</label>
              <input
                type="number"
                step="0.001"
                value={form.xgbLearningRate}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbLearningRate",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Max depth</label>
              <input
                type="number"
                value={form.xgbMaxDepth}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbMaxDepth",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Min child weight</label>
              <input
                type="number"
                step="0.1"
                value={
                  form.xgbMinChildWeight
                }
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbMinChildWeight",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Subsample</label>
              <input
                type="number"
                step="0.01"
                value={form.xgbSubsample}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbSubsample",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Colsample by tree</label>
              <input
                type="number"
                step="0.01"
                value={
                  form.xgbColsampleBytree
                }
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbColsampleBytree",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Reg alpha</label>
              <input
                type="number"
                step="0.1"
                value={form.xgbRegAlpha}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbRegAlpha",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Reg lambda</label>
              <input
                type="number"
                step="0.1"
                value={form.xgbRegLambda}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbRegLambda",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Gamma</label>
              <input
                type="number"
                step="0.1"
                value={form.xgbGamma}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbGamma",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Validation season</label>
              <input
                type="number"
                value={
                  form.xgbValidationSeason
                }
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbValidationSeason",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                Early stopping rounds
              </label>
              <input
                type="number"
                min="0"
                value={
                  form.xgbEarlyStoppingRounds
                }
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "xgbEarlyStoppingRounds",
                    event.target.value,
                  )
                }
              />
            </div>
          </div>
        </section>
      )}

      {randomForestSelected && (
        <section className="panel">
          <div className="panel__header">
            <h2>
              Parametri Random Forest
            </h2>
          </div>

          <div className="training-parameter-grid">
            <div className="field">
              <label>N estimators</label>
              <input
                type="number"
                value={form.rfNEstimators}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "rfNEstimators",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Max depth</label>
              <input
                type="number"
                value={form.rfMaxDepth}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "rfMaxDepth",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Min samples leaf</label>
              <input
                type="number"
                value={
                  form.rfMinSamplesLeaf
                }
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "rfMinSamplesLeaf",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>Class weight</label>
              <select
                value={form.rfClassWeight}
                disabled={running}
                onChange={(event) =>
                  updateField(
                    "rfClassWeight",
                    event.target.value,
                  )
                }
              >
                <option value="balanced">
                  Balanced
                </option>

                <option value="">
                  None
                </option>
              </select>
            </div>
          </div>
        </section>
      )}

      <section className="training-action-panel">
        <div>
          <span className="section-kicker">
            Model Training
          </span>

          <h2>
            Avvia training {form.trainingMode}
          </h2>

          <p>
            Verranno addestrati{" "}
            <strong>
              {form.enabledMarkets.length}
            </strong>{" "}
            mercati con algoritmo{" "}
            <strong>
              {form.modelAlgorithm}
            </strong>{" "}
            e versione{" "}
            <strong>
              {form.modelVersion}
            </strong>.
          </p>
        </div>

        <button
          type="button"
          className="primary-button training-action-button"
          disabled={
            running ||
            loadingDefaults
          }
          onClick={executeTraining}
        >
          {running
            ? "Training in corso..."
            : "Avvia model training"}
        </button>
      </section>

      {running && (
        <div className="loading-banner">
          Training in esecuzione. Il processo può
          richiedere alcuni minuti. Non chiudere la
          pagina.
        </div>
      )}

      <TrainingResult result={result} />
    </div>
  );
}