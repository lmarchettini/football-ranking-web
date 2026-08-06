export default function HomePage({
    onNavigate,
}) {
    const sections = [
        {
            id: "ranking",
            eyebrow: "Prediction Engine",
            title: "Ranking Live",
            description:
                "Genera le selezioni migliori per le prossime partite utilizzando modelli, quote, edge e score.",
            action: "Apri Ranking",
        },
        {
            id: "ingestion",
            eyebrow: "Data Pipeline",
            title: "Aggiornamento dati",
            description:
                "Importa fixture, standings, statistiche e quote, quindi normalizza e prepara le feature.",
            action: "Apri Data Ingestion",
        },
        {
            id: "modelTraining",
            eyebrow: "Model Intelligence",
            title: "Modelli predittivi",
            description:
                "Configura training, calibrazione e versioni dei modelli Machine Learning.",
            action: "Apri Model Training",
        },
        {
            id: "officialBets",
            eyebrow: "System Analytics",
            title: "Le mie giocate",
            description:
                "Controlla singole e multiple ufficiali, risultati, profitto, perdita e ROI.",
            action: "Apri Giocate",
        },
    ];

    return (
        <>
            <section className="home-hero-card">
                <div className="home-hero-card__content">
                    <span className="eyebrow">
                        FOOTBALL INTELLIGENCE PLATFORM
                    </span>

                    <h2>
                        BettingBrain
                    </h2>

                    <p>
                        Analizza dati calcistici, genera pronostici
                        ad alta confidenza e monitora nel tempo
                        modelli, ranking e giocate ufficiali.
                    </p>

                    <div className="home-hero-card__actions">
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                                onNavigate("ranking")
                            }
                        >
                            Genera ranking
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                                onNavigate("calendar")
                            }
                        >
                            Consulta calendario
                        </button>
                    </div>
                </div>

                <div className="home-hero-card__mark">
                    BB
                </div>
            </section>

            <section className="home-section">
                <div className="home-section__header">
                    <div>
                        <span className="eyebrow">
                            Control Center
                        </span>

                        <h2>
                            Gestisci BettingBrain
                        </h2>

                        <p>
                            Accedi rapidamente alle principali aree
                            operative della piattaforma.
                        </p>
                    </div>
                </div>

                <div className="home-module-grid">
                    {sections.map(
                        (section) => (
                            <article
                                key={section.id}
                                className="home-module-card"
                            >
                                <span className="eyebrow">
                                    {section.eyebrow}
                                </span>

                                <h3>
                                    {section.title}
                                </h3>

                                <p>
                                    {section.description}
                                </p>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        onNavigate(
                                            section.id,
                                        )
                                    }
                                >
                                    {section.action}
                                </button>
                            </article>
                        ),
                    )}
                </div>
            </section>
        </>
    );
}