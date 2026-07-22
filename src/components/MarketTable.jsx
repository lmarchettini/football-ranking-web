function percentage(value) {
  return `${(Number(value ?? 0) * 100).toFixed(1)}%`;
}

export default function MarketTable({ markets }) {
  if (!markets?.length) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Performance per mercato</h2>
          <p>
            Contributo di ogni modello alle selezioni finali.
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Mercato</th>
              <th>Totale</th>
              <th>Valutate</th>
              <th>Corrette</th>
              <th>Errate</th>
              <th>Pending</th>
              <th>Accuracy</th>
            </tr>
          </thead>

          <tbody>
            {markets.map((market) => (
              <tr key={market.market}>
                <td>
                  <span className="market-badge">
                    {market.market}
                  </span>
                </td>
                <td>{market.total}</td>
                <td>{market.evaluated}</td>
                <td>{market.correct}</td>
                <td>{market.incorrect}</td>
                <td>{market.pending}</td>
                <td>{percentage(market.accuracy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}