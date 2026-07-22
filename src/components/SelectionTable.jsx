function percentage(value) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
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
              <th>Score</th>
              <th>Risultato</th>
              <th>Esito</th>
            </tr>
          </thead>

          <tbody>
            {selections.map((selection) => {
              const outcome =
                outcomeLabel(selection.outcome);

              return (
                <tr key={`${selection.rank}-${selection.fixtureId}`}>
                  <td>
                    <span className="rank-badge">
                      {selection.rank}
                    </span>
                  </td>

                  <td className="match-cell">
                    {selection.match}
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