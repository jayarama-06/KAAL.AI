-- ═══════════════════════════════════════════════════════════════════════════
-- KAAL TinyML Energy Prediction - Database Schema
-- Adds columns to track prediction accuracy
-- ═══════════════════════════════════════════════════════════════════════════

-- Add prediction tracking columns to energy_checkins table
ALTER TABLE energy_checkins 
ADD COLUMN IF NOT EXISTS prediction_offered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prediction_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS predicted_value INTEGER CHECK (predicted_value IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS prediction_confidence NUMERIC CHECK (prediction_confidence >= 0 AND prediction_confidence <= 1);

-- Add indexes for prediction accuracy queries
CREATE INDEX IF NOT EXISTS idx_energy_checkins_predictions 
ON energy_checkins(user_id, prediction_offered, prediction_accepted) 
WHERE prediction_offered = true;

-- Comments for documentation
COMMENT ON COLUMN energy_checkins.prediction_offered IS 'Whether ML prediction was shown to user (confidence > 0.5)';
COMMENT ON COLUMN energy_checkins.prediction_accepted IS 'Whether user accepted the predicted energy level';
COMMENT ON COLUMN energy_checkins.predicted_value IS 'The ML-predicted energy level (1/2/3)';
COMMENT ON COLUMN energy_checkins.prediction_confidence IS 'Model confidence in prediction (0-1)';

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: Get prediction accuracy for a user
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_prediction_accuracy(p_user_id UUID)
RETURNS TABLE (
  total_predictions BIGINT,
  accepted_predictions BIGINT,
  accuracy_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE prediction_offered = true) AS total_predictions,
    COUNT(*) FILTER (WHERE prediction_offered = true AND prediction_accepted = true) AS accepted_predictions,
    CASE 
      WHEN COUNT(*) FILTER (WHERE prediction_offered = true) > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE prediction_offered = true AND prediction_accepted = true)::NUMERIC / 
         COUNT(*) FILTER (WHERE prediction_offered = true)::NUMERIC) * 100, 
        1
      )
      ELSE 0
    END AS accuracy_percent
  FROM energy_checkins
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: Get ML model stats for a user
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_ml_model_stats(p_user_id UUID)
RETURNS TABLE (
  total_checkins BIGINT,
  predictions_offered BIGINT,
  predictions_accepted BIGINT,
  accuracy_percent NUMERIC,
  avg_confidence NUMERIC,
  ready_for_training BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_checkins,
    COUNT(*) FILTER (WHERE prediction_offered = true) AS predictions_offered,
    COUNT(*) FILTER (WHERE prediction_offered = true AND prediction_accepted = true) AS predictions_accepted,
    CASE 
      WHEN COUNT(*) FILTER (WHERE prediction_offered = true) > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE prediction_offered = true AND prediction_accepted = true)::NUMERIC / 
         COUNT(*) FILTER (WHERE prediction_offered = true)::NUMERIC) * 100, 
        1
      )
      ELSE 0
    END AS accuracy_percent,
    ROUND(AVG(prediction_confidence)::NUMERIC, 2) FILTER (WHERE prediction_offered = true) AS avg_confidence,
    COUNT(*) >= 10 AS ready_for_training
  FROM energy_checkins
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- Performance indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- For training data queries (chronological order)
CREATE INDEX IF NOT EXISTS idx_energy_checkins_training 
ON energy_checkins(user_id, created_at ASC);

-- For accuracy analytics
CREATE INDEX IF NOT EXISTS idx_energy_checkins_accuracy 
ON energy_checkins(user_id, prediction_confidence DESC) 
WHERE prediction_offered = true;
