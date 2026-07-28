function percentage(value, decimals = 2) {
    return `${(Number(value ?? 0) * 100).toFixed(decimals)}%`;
}

function integer(value) {
    return Number(value ?? 0);
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("it-IT", {
        dateStyle: "short",
        timeStyle: "medium",
    }).format(new Date(value));
}

function metricSection(title, metric) {
    const total = integer(metric?.totalPredictions);
    const settled = integer(metric?.settledPredictions);
    const correct = integer(metric?.correctPredictions);
    const wrong = integer(metric?.wrongPredictions);
    const pending = Math.max(0, total - settled);

    return [
        title,
        "-".repeat(title.length),
        `Previsioni totali: ${total}`,
        `Previsioni definite: ${settled}`,
        `Previsioni corrette: ${correct}`,
        `Previsioni errate: ${wrong}`,
        `Previsioni non definite: ${pending}`,
        `Accuracy: ${percentage(metric?.accuracy)}`,
        "",
    ].join("\n");
}

function tableSection({
    title,
    rows,
    firstColumnLabel,
    firstColumnValue,
}) {
    const lines = [
        title,
        "-".repeat(title.length),
    ];

    if (!rows?.length) {
        lines.push("Nessun dato disponibile.", "");

        return lines.join("\n");
    }

    rows.forEach((row) => {
        const total = integer(row.totalPredictions);
        const settled = integer(row.settledPredictions);
        const pending = Math.max(0, total - settled);

        lines.push(
            `${firstColumnLabel}: ${firstColumnValue(row)}`,
            `  Totale: ${total}`,
            `  Definite: ${settled}`,
            `  Corrette: ${integer(row.correctPredictions)}`,
            `  Errate: ${integer(row.wrongPredictions)}`,
            `  Non definite: ${pending}`,
            `  Accuracy: ${percentage(row.accuracy)}`,
            "",
        );
    });

    return lines.join("\n");
}

export function buildPerformanceReport({
    data,
    selectedRunId,
    runs,
}) {
    const selectedRun = runs.find(
        (run) => String(run.runId) === String(selectedRunId),
    );

    const periodDescription =
        selectedRunId === "ALL"
            ? "Tutto il periodo"
            : selectedRun
                ? `Run #${selectedRun.runId} - ${selectedRun.periodFrom} / ${selectedRun.periodTo}`
                : `Run #${selectedRunId}`;

    return [
        "BETTINGBRAIN - RANKING PERFORMANCE REPORT",
        "==========================================",
        "",
        `Data esportazione: ${formatDateTime(new Date())}`,
        `Periodo: ${periodDescription}`,
        "",
        metricSection("TOP 3", data.top3),
        metricSection("TOP 5", data.top5),
        metricSection("TOP 10", data.top10),
        metricSection("OVERALL", data.summary),
        tableSection({
            title: "PERFORMANCE PER MERCATO",
            rows: data.markets,
            firstColumnLabel: "Mercato",
            firstColumnValue: (row) => row.market ?? "—",
        }),
        tableSection({
            title: "PERFORMANCE PER LEGA",
            rows: data.leagues,
            firstColumnLabel: "Lega",
            firstColumnValue: (row) =>
                row.leagueName || `League ${row.leagueId}`,
        }),
        tableSection({
            title: "CALIBRAZIONE PER SCORE",
            rows: data.buckets,
            firstColumnLabel: "Score bucket",
            firstColumnValue: (row) => row.bucket ?? "—",
        }),
    ].join("\n");
}

export function downloadPerformanceReport({
    data,
    selectedRunId,
    runs,
}) {
    if (!data) {
        return;
    }

    const report = buildPerformanceReport({
        data,
        selectedRunId,
        runs,
    });

    const blob = new Blob(
        [report],
        {
            type: "text/plain;charset=utf-8",
        },
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    const periodSuffix =
        selectedRunId === "ALL"
            ? "all"
            : `run-${selectedRunId}`;

    link.href = url;
    link.download =
        `bettingbrain-performance-${periodSuffix}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}