-- =============================================
-- daily_best_prices : meilleur prix quotidien par destination par mois
-- Chaque scan accumule le best deal du jour pour chaque mois à venir.
-- Les moyennes mensuelles se calculent à partir de ces snapshots quotidiens.
-- =============================================

CREATE TABLE IF NOT EXISTS daily_best_prices (
    id BIGSERIAL PRIMARY KEY,
    destination_code TEXT NOT NULL,
    destination TEXT NOT NULL,
    scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    departure_month TEXT NOT NULL,        -- format 'YYYY-MM' (ex: '2026-04')
    best_price NUMERIC NOT NULL,
    airline TEXT,
    stops INTEGER,
    departure_date DATE,                  -- date exacte du meilleur vol
    return_date DATE,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un seul snapshot par destination × jour × mois de départ
    CONSTRAINT uq_daily_best UNIQUE (destination_code, scan_date, departure_month)
);

-- Index pour requêtes de moyennes mensuelles
CREATE INDEX idx_daily_best_dest_month
    ON daily_best_prices (destination_code, departure_month);

-- Index pour nettoyage des vieilles données
CREATE INDEX idx_daily_best_scan_date
    ON daily_best_prices (scan_date);

-- RLS : lecture publique, écriture admin seulement
ALTER TABLE daily_best_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read daily_best_prices"
    ON daily_best_prices FOR SELECT
    USING (true);

CREATE POLICY "Admin insert daily_best_prices"
    ON daily_best_prices FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin update daily_best_prices"
    ON daily_best_prices FOR UPDATE
    USING (true);
