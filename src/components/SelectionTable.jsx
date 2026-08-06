function formatPercentage(
  value,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${(
    number * 100
  ).toFixed(2)}%`;
}

function formatDecimal(
  value,
  digits = 2,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString(
    "it-IT",
    {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    },
  );
}

function formatDateTime(
  value,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function hasValidOfficialBetData(
  selection,
) {
  const rankedPredictionId =
    Number(
      selection
        ?.rankedPredictionId,
    );

  const decimalOdds =
    Number(
      selection
        ?.decimalOdds,
    );

  return (
    Number.isFinite(
      rankedPredictionId,
    ) &&
    rankedPredictionId > 0 &&
    Number.isFinite(
      decimalOdds,
    ) &&
    decimalOdds > 1
  );
}

export default function SelectionTable({
  selections = [],
  selectedPredictionIds = [],
  onToggleSelection,
  onToggleAll,
  selectionEnabled = true,
}) {
  const selectedIds =
    new Set(
      selectedPredictionIds,
    );

  const selectableSelections =
    selections.filter(
      hasValidOfficialBetData,
    );

  const allSelectableSelected =
    selectableSelections.length > 0 &&
    selectableSelections.every(
      (selection) =>
        selectedIds.has(
          selection
            .rankedPredictionId,
        ),
    );

  const someSelectableSelected =
    selectableSelections.some(
      (selection) =>
        selectedIds.has(
          selection
            .rankedPredictionId,
        ),
    );

  if (
    !Array.isArray(selections) ||
    selections.length === 0
  ) {
    return (
      <div className="empty-state">
        <h3>
          Nessun pronostico disponibile
        </h3>

        <p>
          Genera un ranking per visualizzare
          le selezioni.
        </p>
      </div>
    );
  }

  function handleToggleAll() {
    if (
      !selectionEnabled ||
      selectableSelections.length === 0
    ) {
      return;
    }

    onToggleAll?.(
      selectableSelections,
      !allSelectableSelected,
    );
  }

  return (
    <div className="table-wrapper">
      <table className="selection-table">
        <thead>
          <tr>
            <th className="selection-checkbox-column">
              <input
                type="checkbox"
                aria-label="Seleziona tutti i pronostici"
                checked={
                  allSelectableSelected
                }
                ref={(
                  checkbox,
                ) => {
                  if (checkbox) {
                    checkbox.indeterminate =
                      !allSelectableSelected &&
                      someSelectableSelected;
                  }
                }}
                onChange={
                  handleToggleAll
                }
                disabled={
                  !selectionEnabled ||
                  selectableSelections.length ===
                  0
                }
              />
            </th>

            <th>
              #
            </th>

            <th>
              Partita
            </th>

            <th>
              Lega
            </th>

            <th>
              Pronostico
            </th>

            <th>
              Probabilità
            </th>

            <th>
              Quota
            </th>

            <th>
              Edge
            </th>

            <th>
              EV
            </th>

            <th>
              Bookmaker
            </th>

            <th>
              Score
            </th>

            <th>
              Quota aggiornata
            </th>
          </tr>
        </thead>

        <tbody>
          {selections.map(
            (selection) => {
              const predictionId =
                selection
                  .rankedPredictionId;

              const selectable =
                selectionEnabled &&
                hasValidOfficialBetData(
                  selection,
                );

              const selected =
                selectable &&
                selectedIds.has(
                  predictionId,
                );

              return (
                <tr
                  key={
                    predictionId ??
                    `${selection.fixtureId}-${selection.market}-${selection.rank}`
                  }
                  className={
                    selected
                      ? "selection-row selection-row--selected"
                      : "selection-row"
                  }
                >
                  <td className="selection-checkbox-column">
                    <input
                      type="checkbox"
                      aria-label={`Seleziona ${selection.homeTeam} - ${selection.awayTeam}`}
                      checked={
                        selected
                      }
                      disabled={
                        !selectable
                      }
                      onChange={() =>
                        onToggleSelection?.(
                          selection,
                        )
                      }
                    />
                  </td>

                  <td>
                    {
                      selection.rank
                    }
                  </td>

                  <td>
                    <div className="match-cell">
                      <strong>
                        {
                          selection.homeTeam
                        }{" "}
                        -{" "}
                        {
                          selection.awayTeam
                        }
                      </strong>

                      <span>
                        {formatDateTime(
                          selection.kickoff,
                        )}
                      </span>
                    </div>
                  </td>

                  <td>
                    {
                      selection.leagueName
                    }
                  </td>

                  <td>
                    <span className="market-badge">
                      {
                        selection
                          .marketDisplayName
                      }
                    </span>
                  </td>

                  <td>
                    {formatPercentage(
                      selection.effectiveProbability ??
                      selection.modelProbability,
                    )}
                  </td>

                  <td>
                    {formatDecimal(
                      selection
                        .decimalOdds,
                      2,
                    )}
                  </td>

                  <td>
                    {formatPercentage(
                      selection.edge,
                    )}
                  </td>

                  <td>
                    {formatPercentage(
                      selection
                        .expectedValue,
                    )}
                  </td>

                  <td>
                    {
                      selection.bookmaker ||
                      "—"
                    }
                  </td>

                  <td>
                    {formatDecimal(
                      selection.score,
                      2,
                    )}
                  </td>

                  <td>
                    {formatDateTime(
                      selection
                        .oddsFetchedAt,
                    )}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}