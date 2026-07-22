function percentage(value) {
  return `${(Number(value ?? 0) * 100).toFixed(1)}%`;
}

export default function PerformanceTable({
  title,
  description,
  rows,
  firstColumnLabel,
  firstColumnValue,
}) {
  if (!rows?.length) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{firstColumnLabel}</th>
              <th>Totale</th>
              <th>Definite</th>
              <th>Corrette</th>
              <th>Errate</th>
              <th>Accuracy</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const firstColumn =
                firstColumnValue(row);

              return (
                <tr key={`${firstColumn}-${index}`}>
                  <td>
                    <span className="market-badge">
                      {firstColumn}
                    </span>
                  </td>

                  <td>{row.totalPredictions}</td>
                  <td>{row.settledPredictions}</td>
                  <td>{row.correctPredictions}</td>
                  <td>{row.wrongPredictions}</td>
                  <td>{percentage(row.accuracy)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}