import axios from "axios";

import {
    apiUrl,
} from "../config/runtimeConfig";

const api = axios.create({
    baseURL: apiUrl(
        "PERFORMANCE_API_URL",
        "VITE_PERFORMANCE_API_URL",
        "http://localhost:8088",
    ),

    /*
     * Il settlement potrebbe elaborare diverse
     * giocate e fixture, quindi manteniamo un
     * timeout sufficientemente ampio.
     */
    timeout: 300000,

    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Crea una giocata ufficiale.
 *
 * SINGLE:
 * - deve contenere un solo rankedPredictionId.
 *
 * MULTIPLE:
 * - deve contenere almeno due rankedPredictionIds.
 */
export async function createOfficialBet({
    betType,
    stake,
    bookmaker,
    notes,
    rankedPredictionIds,
}) {
    const response = await api.post(
        "/api/v1/official-bets",
        {
            betType,
            stake,
            bookmaker:
                bookmaker?.trim() || null,
            notes:
                notes?.trim() || null,
            rankedPredictionIds,
        },
    );

    return response.data;
}

/**
 * Restituisce tutte le giocate ufficiali,
 * comprese le relative selezioni.
 */
export async function getOfficialBets() {
    const response = await api.get(
        "/api/v1/official-bets",
    );

    return response.data;
}

/**
 * Restituisce il dettaglio di una singola
 * giocata ufficiale.
 */
export async function getOfficialBet(
    officialBetId,
) {
    const response = await api.get(
        `/api/v1/official-bets/${officialBetId}`,
    );

    return response.data;
}

/**
 * Restituisce il riepilogo economico:
 *
 * - giocate totali;
 * - singole;
 * - multiple;
 * - vinte;
 * - perse;
 * - in attesa;
 * - capitale puntato;
 * - ritorno;
 * - profitto/perdita;
 * - ROI;
 * - quota media.
 */
export async function getOfficialBetSummary() {
    const response = await api.get(
        "/api/v1/official-bets/summary",
    );

    return response.data;
}

/**
 * Aggiorna gli esiti delle selezioni in attesa
 * leggendo i risultati presenti in fixtures.
 */
export async function settleOfficialBets() {
    const response = await api.post(
        "/api/v1/official-bets/settle",
    );

    return response.data;
}

/**
 * Elimina una giocata ancora PENDING.
 *
 * Il backend impedirà l'eliminazione quando:
 * - la giocata è già definita;
 * - almeno una partita è già iniziata.
 */
export async function deleteOfficialBet(
    officialBetId,
) {
    await api.delete(
        `/api/v1/official-bets/${officialBetId}`,
    );
}