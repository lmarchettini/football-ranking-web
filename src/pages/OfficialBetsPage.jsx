import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    deleteOfficialBet,
    getOfficialBets,
    getOfficialBetSummary,
    settleOfficialBets,
} from "../api/officialBetsApi";

function formatCurrency(value) {
    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return new Intl.NumberFormat(
        "it-IT",
        {
            style: "currency",
            currency: "EUR",
        },
    ).format(number);
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

function formatPercentage(value) {
    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return `${formatDecimal(
        number,
        2,
    )}%`;
}

function formatDateTime(value) {
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

function getBetTypeLabel(
    betType,
) {
    switch (betType) {
        case "SINGLE":
            return "Singola";

        case "MULTIPLE":
            return "Multipla";

        default:
            return betType || "—";
    }
}

function getBetStatusLabel(
    status,
) {
    switch (status) {
        case "PENDING":
            return "In attesa";

        case "WON":
            return "Vinta";

        case "LOST":
            return "Persa";

        case "VOID":
            return "Annullata";

        default:
            return status || "—";
    }
}

function getSelectionStatusLabel(
    status,
) {
    switch (status) {
        case "PENDING":
            return "In attesa";

        case "WON":
            return "Corretta";

        case "LOST":
            return "Errata";

        case "VOID":
            return "Annullata";

        default:
            return status || "—";
    }
}

function statusClassName(
    status,
) {
    switch (status) {
        case "WON":
            return "status-badge status-badge--success";

        case "LOST":
            return "status-badge status-badge--danger";

        case "VOID":
            return "status-badge status-badge--neutral";

        default:
            return "status-badge status-badge--pending";
    }
}

function profitClassName(value) {
    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "";
    }

    if (number > 0) {
        return "money-value money-value--positive";
    }

    if (number < 0) {
        return "money-value money-value--negative";
    }

    return "money-value";
}

function getErrorMessage(
    error,
    fallback,
) {
    return (
        error?.response?.data?.message ??
        error?.message ??
        fallback
    );
}

function OfficialBetSummary({
    summary,
}) {
    const cards = [
        {
            label: "Giocate totali",
            value:
                summary.totalBets ?? 0,
        },
        {
            label: "In attesa",
            value:
                summary.pendingBets ?? 0,
        },
        {
            label: "Vinte",
            value:
                summary.wonBets ?? 0,
        },
        {
            label: "Perse",
            value:
                summary.lostBets ?? 0,
        },
        {
            label: "Capitale puntato",
            value: formatCurrency(
                summary.totalStake,
            ),
        },
        {
            label: "Ritorno totale",
            value: formatCurrency(
                summary.totalReturn,
            ),
        },
        {
            label: "Profitto / perdita",
            value: formatCurrency(
                summary.profitLoss,
            ),
            valueClassName:
                profitClassName(
                    summary.profitLoss,
                ),
        },
        {
            label: "ROI",
            value: formatPercentage(
                summary.roi,
            ),
            valueClassName:
                profitClassName(
                    summary.roi,
                ),
        },
        {
            label: "Quota media",
            value: formatDecimal(
                summary.averageOdds,
                2,
            ),
        },
    ];

    return (
        <section className="official-bet-summary-grid">
            {cards.map(
                (card) => (
                    <article
                        key={card.label}
                        className="official-bet-summary-card"
                    >
                        <span>
                            {card.label}
                        </span>

                        <strong
                            className={
                                card.valueClassName
                            }
                        >
                            {card.value}
                        </strong>
                    </article>
                ),
            )}
        </section>
    );
}

function OfficialBetSelection({
    selection,
}) {
    const finalResult =
        selection.actualHomeGoals != null &&
            selection.actualAwayGoals != null
            ? `${selection.actualHomeGoals} - ${selection.actualAwayGoals}`
            : "—";

    return (
        <article className="official-bet-selection">
            <div className="official-bet-selection__match">
                <strong>
                    {selection.homeTeam}
                    {" - "}
                    {selection.awayTeam}
                </strong>

                <span>
                    {formatDateTime(
                        selection.kickoff,
                    )}
                </span>
            </div>

            <div className="official-bet-selection__market">
                <span>
                    Pronostico
                </span>

                <strong>
                    {selection.marketDisplayName ??
                        selection.market}
                </strong>
            </div>

            <div>
                <span>
                    Quota
                </span>

                <strong>
                    {formatDecimal(
                        selection.decimalOdds,
                        2,
                    )}
                </strong>
            </div>

            <div>
                <span>
                    Risultato
                </span>

                <strong>
                    {finalResult}
                </strong>
            </div>

            <div>
                <span
                    className={statusClassName(
                        selection.status,
                    )}
                >
                    {getSelectionStatusLabel(
                        selection.status,
                    )}
                </span>
            </div>
        </article>
    );
}

function OfficialBetCard({
    bet,
    deletingId,
    onDelete,
}) {
    const [expanded, setExpanded] =
        useState(false);

    const pending =
        bet.status === "PENDING";

    return (
        <article className="official-bet-card">
            <div className="official-bet-card__header">
                <div>
                    <div className="official-bet-card__title-row">
                        <h3>
                            {getBetTypeLabel(
                                bet.betType,
                            )}
                            {" #"}
                            {bet.id}
                        </h3>

                        <span
                            className={statusClassName(
                                bet.status,
                            )}
                        >
                            {getBetStatusLabel(
                                bet.status,
                            )}
                        </span>
                    </div>

                    <p>
                        Inserita il{" "}
                        {formatDateTime(
                            bet.placedAt,
                        )}
                    </p>
                </div>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                        setExpanded(
                            (current) =>
                                !current,
                        )
                    }
                >
                    {expanded
                        ? "Nascondi dettaglio"
                        : "Mostra dettaglio"}
                </button>
            </div>

            <div className="official-bet-card__metrics">
                <div>
                    <span>
                        Selezioni
                    </span>

                    <strong>
                        {bet.selections?.length ??
                            0}
                    </strong>
                </div>

                <div>
                    <span>
                        Puntata
                    </span>

                    <strong>
                        {formatCurrency(
                            bet.stake,
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Quota totale
                    </span>

                    <strong>
                        {formatDecimal(
                            bet.totalOdds,
                            2,
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Ritorno potenziale
                    </span>

                    <strong>
                        {formatCurrency(
                            bet.potentialReturn,
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Ritorno effettivo
                    </span>

                    <strong>
                        {bet.actualReturn == null
                            ? "—"
                            : formatCurrency(
                                bet.actualReturn,
                            )}
                    </strong>
                </div>

                <div>
                    <span>
                        Profitto / perdita
                    </span>

                    <strong
                        className={profitClassName(
                            bet.profitLoss,
                        )}
                    >
                        {bet.profitLoss == null
                            ? "—"
                            : formatCurrency(
                                bet.profitLoss,
                            )}
                    </strong>
                </div>
            </div>

            {(bet.bookmaker ||
                bet.notes) && (
                    <div className="official-bet-card__metadata">
                        {bet.bookmaker && (
                            <span>
                                Bookmaker:{" "}
                                <strong>
                                    {bet.bookmaker}
                                </strong>
                            </span>
                        )}

                        {bet.notes && (
                            <span>
                                Note:{" "}
                                <strong>
                                    {bet.notes}
                                </strong>
                            </span>
                        )}
                    </div>
                )}

            {expanded && (
                <div className="official-bet-card__detail">
                    {(bet.selections ?? []).map(
                        (selection) => (
                            <OfficialBetSelection
                                key={selection.id}
                                selection={
                                    selection
                                }
                            />
                        ),
                    )}
                </div>
            )}

            {pending && (
                <div className="official-bet-card__footer">
                    <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                            onDelete(bet)
                        }
                        disabled={
                            deletingId === bet.id
                        }
                    >
                        {deletingId === bet.id
                            ? "Eliminazione..."
                            : "Elimina giocata"}
                    </button>
                </div>
            )}
        </article>
    );
}

export default function OfficialBetsPage() {
    const [bets, setBets] =
        useState([]);

    const [summary, setSummary] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [
        settlementLoading,
        setSettlementLoading,
    ] = useState(false);

    const [deletingId, setDeletingId] =
        useState(null);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const loadData =
        useCallback(async () => {
            setLoading(true);
            setError("");

            try {
                const [
                    betsResponse,
                    summaryResponse,
                ] = await Promise.all([
                    getOfficialBets(),
                    getOfficialBetSummary(),
                ]);

                setBets(
                    Array.isArray(
                        betsResponse,
                    )
                        ? betsResponse
                        : [],
                );

                setSummary(
                    summaryResponse,
                );
            } catch (requestError) {
                setError(
                    getErrorMessage(
                        requestError,
                        "Impossibile caricare le giocate ufficiali.",
                    ),
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleSettlement() {
        setSettlementLoading(true);
        setError("");
        setMessage("");

        try {
            const result =
                await settleOfficialBets();

            setMessage(
                `Aggiornamento completato: ${result.selectionsSettled ?? 0} selezioni e ${result.betsSettled ?? 0} giocate definite.`,
            );

            await loadData();
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    "Impossibile aggiornare gli esiti.",
                ),
            );
        } finally {
            setSettlementLoading(false);
        }
    }

    async function handleDelete(bet) {
        const confirmed =
            window.confirm(
                `Vuoi eliminare la giocata #${bet.id}?`,
            );

        if (!confirmed) {
            return;
        }

        setDeletingId(bet.id);
        setError("");
        setMessage("");

        try {
            await deleteOfficialBet(
                bet.id,
            );

            setMessage(
                `Giocata #${bet.id} eliminata correttamente.`,
            );

            await loadData();
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    "Impossibile eliminare la giocata.",
                ),
            );
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <>
            <section className="panel">
                <div className="panel__header official-bets-page-header">
                    <div>
                        <span className="eyebrow">
                            System Analytics
                        </span>

                        <h2>
                            Le mie giocate
                        </h2>

                        <p>
                            Monitora singole e
                            multiple, risultati,
                            profitto e rendimento
                            complessivo.
                        </p>
                    </div>

                    <div className="official-bets-page-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={loadData}
                            disabled={
                                loading ||
                                settlementLoading
                            }
                        >
                            Aggiorna dati
                        </button>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={
                                handleSettlement
                            }
                            disabled={
                                loading ||
                                settlementLoading
                            }
                        >
                            {settlementLoading
                                ? "Aggiornamento esiti..."
                                : "Aggiorna esiti"}
                        </button>
                    </div>
                </div>
            </section>

            {error && (
                <div className="form-alert form-alert--error">
                    {error}
                </div>
            )}

            {message && (
                <div className="form-alert form-alert--success">
                    {message}
                </div>
            )}

            {loading && (
                <section className="panel">
                    <div className="empty-state">
                        <h3>
                            Caricamento giocate
                        </h3>

                        <p>
                            Recupero del riepilogo
                            economico e dello
                            storico in corso.
                        </p>
                    </div>
                </section>
            )}

            {!loading &&
                summary && (
                    <OfficialBetSummary
                        summary={summary}
                    />
                )}

            {!loading &&
                bets.length === 0 && (
                    <section className="panel">
                        <div className="empty-state">
                            <h3>
                                Nessuna giocata
                                ufficiale
                            </h3>

                            <p>
                                Apri la pagina Ranking,
                                seleziona uno o più
                                pronostici e crea una
                                singola o una multipla.
                            </p>
                        </div>
                    </section>
                )}

            {!loading &&
                bets.length > 0 && (
                    <section className="official-bets-list">
                        {bets.map(
                            (bet) => (
                                <OfficialBetCard
                                    key={bet.id}
                                    bet={bet}
                                    deletingId={
                                        deletingId
                                    }
                                    onDelete={
                                        handleDelete
                                    }
                                />
                            ),
                        )}
                    </section>
                )}
        </>
    );
}