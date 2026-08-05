function percentage(value) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function decimal(value, digits = 2) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toFixed(digits);
}

function signedPercentage(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numericValue = Number(value);
  const sign = numericValue > 0 ? "+" : "";

  return `${sign}${(numericValue * 100).toFixed(2)}%`;
}

function formatOddsDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getOddsFreshness(value) {
  if (!value) {
    return {
      label: "Data non disponibile",
      className:
        "odds-freshness odds-freshness--unknown",
    };
  }

  const fetchedAt =
    new Date(value);

  if (
    Number.isNaN(
      fetchedAt.getTime(),
    )
  ) {
    return {
      label: "Data non valida",
      className:
        "odds-freshness odds-freshness--unknown",
    };
  }

  const ageMilliseconds =
    Date.now() -
    fetchedAt.getTime();

  /*
   * Se c'è una piccola differenza di clock
   * tra client e server, non mostriamo
   * un'età negativa.
   */
  const ageHours =
    Math.max(
      0,
      ageMilliseconds /
        (1000 * 60 * 60),
    );

  if (ageHours < 6) {
    return {
      label: "Recente",
      className:
        "odds-freshness odds-freshness--fresh",
    };
  }

  if (ageHours < 24) {
    return {
      label: "Oggi",
      className:
        "odds-freshness odds-freshness--warning",
    };
  }

  return {
    label: "Da aggiornare",
    className:
      "odds-freshness odds-freshness--stale",
  };
}

function outcomeLabel(outcome) {
  switch (outcome) {
    case "CORRECT":
      return {
        icon: "✓",
        text: "Corretto",
        className: "outcome outcome--correct",
      };

    case "INCORRECT":
      return {
        icon: "✕",
        text: "Errato",
        className: "outcome outcome--incorrect",
      };

    default:
      return {
        icon: "…",
        text: "In attesa",
        className: "outcome outcome--pending",
      };
  }
}

export default function SelectionTable({ selections }) {
  if (!selections?.length) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Dettaglio selezioni</h2>
          <p>
            Pronostici ordinati in base allo score del
            Ranking Service.
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Partita</th>
              <th>Lega</th>
              <th>Mercato</th>
              <th>Probabilità</th>
              <th>Quota</th>
              <th>Edge</th>
              <th>EV</th>
              <th>Bookmaker</th>
              <th>Quota aggiornata</th>
              <th>Score</th>
              <th>Risultato</th>
              <th>Esito</th>
            </tr>
          </thead>

          <tbody>
            {selections.map((selection) => {
              const outcome =
                outcomeLabel(selection.outcome);

              const oddsFreshness =
                getOddsFreshness(
                  selection.oddsFetchedAt,
                );

              return (
                <tr key={`${selection.rank}-${selection.fixtureId}`}>
                  <td>
                    <span className="rank-badge">
                      {selection.rank}
                    </span>
                  </td>

                  <td className="match-cell">
                    {selection.match ||
                      [
                        selection.homeTeam,
                        selection.awayTeam,
                      ]
                        .filter(Boolean)
                        .join(" - ") ||
                      "Partita non disponibile"}
                  </td>

                  <td>{selection.leagueName}</td>

                  <td>
                    <span className="market-badge">
                      {selection.marketDisplayName}
                    </span>
                  </td>

                  <td>
                    {percentage(
                      selection.modelProbability,
                    )}
                  </td>

                  <td>
                    {decimal(
                      selection.decimalOdds,
                      2,
                    )}
                  </td>

                  <td>
                    {signedPercentage(
                      selection.edge,
                    )}
                  </td>

                  <td>
                    {signedPercentage(
                      selection.expectedValue,
                    )}
                  </td>

                  <td>
                    {selection.bookmaker ?? "—"}
                  </td>

                  <td>
                    {selection.oddsFetchedAt ? (
                      <div className="odds-updated-cell">
                        <strong>
                          {formatOddsDate(
                            selection.oddsFetchedAt,
                          )}
                        </strong>

                        <span
                          className={
                            oddsFreshness.className
                          }
                        >
                          {oddsFreshness.label}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {Number(selection.score).toFixed(2)}
                  </td>

                  <td>
                    {selection.finalResult ?? "—"}
                  </td>

                  <td>
                    <span className={outcome.className}>
                      <span>{outcome.icon}</span>
                      {outcome.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}