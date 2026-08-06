import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    createOfficialBet,
} from "../api/officialBetsApi";

function formatDecimal(
    value,
    digits = 2,
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
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

function formatCurrency(
    value,
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
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

function normalizeStake(
    value,
) {
    const normalized =
        String(value)
            .trim()
            .replace(",", ".");

    const number =
        Number(normalized);

    return Number.isFinite(number)
        ? number
        : 0;
}

export default function BetCreationModal({
    open,
    selections,
    onClose,
    onCreated,
}) {
    const [betType, setBetType] =
        useState("SINGLE");

    const [stake, setStake] =
        useState("10");

    const [bookmaker, setBookmaker] =
        useState("");

    const [notes, setNotes] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setError("");
        setLoading(false);
        setStake("10");
        setNotes("");

        const bookmakerNames =
            selections
                .map(
                    (selection) =>
                        selection.bookmaker,
                )
                .filter(Boolean);

        const uniqueBookmakers =
            [...new Set(bookmakerNames)];

        setBookmaker(
            uniqueBookmakers.length === 1
                ? uniqueBookmakers[0]
                : "",
        );

        setBetType(
            selections.length > 1
                ? "MULTIPLE"
                : "SINGLE",
        );
    }, [
        open,
        selections,
    ]);

    const selectedOdds =
        useMemo(
            () =>
                selections.map(
                    (selection) =>
                        Number(
                            selection.decimalOdds,
                        ),
                ),
            [selections],
        );

    const invalidOdds =
        selectedOdds.some(
            (odd) =>
                !Number.isFinite(odd) ||
                odd <= 1,
        );

    const totalOdds =
        useMemo(() => {
            if (
                selections.length === 0 ||
                invalidOdds
            ) {
                return 0;
            }

            if (betType === "SINGLE") {
                return selectedOdds[0];
            }

            return selectedOdds.reduce(
                (
                    accumulator,
                    odd,
                ) =>
                    accumulator * odd,
                1,
            );
        }, [
            betType,
            invalidOdds,
            selectedOdds,
            selections.length,
        ]);

    const numericStake =
        normalizeStake(stake);

    const potentialReturn =
        numericStake > 0 &&
            totalOdds > 0
            ? numericStake *
            totalOdds
            : 0;

    const potentialProfit =
        potentialReturn > 0
            ? potentialReturn -
            numericStake
            : 0;

    const canSubmit =
        selections.length > 0 &&
        numericStake > 0 &&
        !invalidOdds &&
        !loading &&
        (
            betType === "SINGLE"
                ? selections.length === 1
                : selections.length >= 2
        );

    async function handleSubmit(
        event,
    ) {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const createdBet =
                await createOfficialBet({
                    betType,
                    stake:
                        numericStake,
                    bookmaker,
                    notes,
                    rankedPredictionIds:
                        selections.map(
                            (selection) =>
                                selection
                                    .rankedPredictionId,
                        ),
                });

            onCreated?.(
                createdBet,
            );
        } catch (requestError) {
            const responseMessage =
                requestError
                    ?.response
                    ?.data
                    ?.message;

            setError(
                responseMessage ||
                "Impossibile creare la giocata ufficiale.",
            );
        } finally {
            setLoading(false);
        }
    }

    if (!open) {
        return null;
    }

    return (
        <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={
                loading
                    ? undefined
                    : onClose
            }
        >
            <section
                className="bet-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bet-modal-title"
                onMouseDown={(
                    event,
                ) =>
                    event.stopPropagation()
                }
            >
                <div className="bet-modal__header">
                    <div>
                        <span className="eyebrow">
                            Giocata ufficiale
                        </span>

                        <h2
                            id="bet-modal-title"
                        >
                            Conferma pronostici
                        </h2>

                        <p>
                            Salva la giocata per
                            monitorare esito,
                            profitto e ROI.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="icon-button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Chiudi"
                    >
                        ×
                    </button>
                </div>

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div className="bet-modal__content">
                        <div className="bet-type-selector">
                            <button
                                type="button"
                                className={
                                    betType ===
                                        "SINGLE"
                                        ? "bet-type-option bet-type-option--active"
                                        : "bet-type-option"
                                }
                                onClick={() =>
                                    setBetType(
                                        "SINGLE",
                                    )
                                }
                                disabled={
                                    selections.length !==
                                    1 ||
                                    loading
                                }
                            >
                                <strong>
                                    Singola
                                </strong>

                                <span>
                                    Una selezione
                                </span>
                            </button>

                            <button
                                type="button"
                                className={
                                    betType ===
                                        "MULTIPLE"
                                        ? "bet-type-option bet-type-option--active"
                                        : "bet-type-option"
                                }
                                onClick={() =>
                                    setBetType(
                                        "MULTIPLE",
                                    )
                                }
                                disabled={
                                    selections.length < 2 ||
                                    loading
                                }
                            >
                                <strong>
                                    Multipla
                                </strong>

                                <span>
                                    {selections.length} selezioni
                                </span>
                            </button>
                        </div>

                        <div className="bet-selection-list">
                            {selections.map(
                                (selection) => (
                                    <article
                                        key={
                                            selection
                                                .rankedPredictionId
                                        }
                                        className="bet-selection-card"
                                    >
                                        <div>
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
                                                {
                                                    selection.marketDisplayName
                                                }
                                            </span>
                                        </div>

                                        <div className="bet-selection-card__odds">
                                            <span>
                                                Quota
                                            </span>

                                            <strong>
                                                {formatDecimal(
                                                    selection
                                                        .decimalOdds,
                                                    2,
                                                )}
                                            </strong>
                                        </div>
                                    </article>
                                ),
                            )}
                        </div>

                        {invalidOdds && (
                            <div className="form-alert form-alert--error">
                                Una o più selezioni
                                non hanno una quota
                                valida. Non possono
                                essere confermate.
                            </div>
                        )}

                        <div className="bet-form-grid">
                            <div className="field">
                                <label htmlFor="bet-stake">
                                    Puntata
                                </label>

                                <div className="input-with-suffix">
                                    <input
                                        id="bet-stake"
                                        type="text"
                                        inputMode="decimal"
                                        value={stake}
                                        onChange={(
                                            event,
                                        ) =>
                                            setStake(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={loading}
                                        required
                                    />

                                    <span>
                                        €
                                    </span>
                                </div>
                            </div>

                            <div className="field">
                                <label htmlFor="bet-bookmaker">
                                    Bookmaker
                                </label>

                                <input
                                    id="bet-bookmaker"
                                    type="text"
                                    value={bookmaker}
                                    onChange={(
                                        event,
                                    ) =>
                                        setBookmaker(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={loading}
                                    placeholder="Es. Betano"
                                />
                            </div>

                            <div className="field bet-notes-field">
                                <label htmlFor="bet-notes">
                                    Note
                                </label>

                                <textarea
                                    id="bet-notes"
                                    value={notes}
                                    onChange={(
                                        event,
                                    ) =>
                                        setNotes(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={loading}
                                    rows="3"
                                    maxLength="1000"
                                    placeholder="Es. Multipla weekend"
                                />
                            </div>
                        </div>

                        <div className="bet-calculation">
                            <div>
                                <span>
                                    Selezioni
                                </span>

                                <strong>
                                    {
                                        selections.length
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Quota totale
                                </span>

                                <strong>
                                    {formatDecimal(
                                        totalOdds,
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
                                        potentialReturn,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Profitto potenziale
                                </span>

                                <strong>
                                    {formatCurrency(
                                        potentialProfit,
                                    )}
                                </strong>
                            </div>
                        </div>

                        {error && (
                            <div className="form-alert form-alert--error">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="bet-modal__footer">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Annulla
                        </button>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={
                                !canSubmit
                            }
                        >
                            {loading
                                ? "Salvataggio..."
                                : betType ===
                                    "MULTIPLE"
                                    ? "Conferma multipla"
                                    : "Conferma singola"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}