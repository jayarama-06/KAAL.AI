// ═══════════════════════════════════════════════════════════════════════════
// KAAL TinyML Energy Prediction
// On-device learning using ml5.js · Zero API cost · Privacy-preserving
// ═══════════════════════════════════════════════════════════════════════════

declare global {
  interface Window {
    ml5: any;
  }
}

export interface CheckinRow {
  created_at: string;
  energy_level: 1 | 2 | 3;
  tasks_done_last_2h: number;
  session_duration_mins: number;
  mins_since_last_break: number;
}

export interface CurrentContext {
  tasks_done_last_2h: number;
  session_duration_mins: number;
  mins_since_last_break: number;
}

export interface EnergyPrediction {
  predicted_energy: 1 | 2 | 3;
  confidence: number;
}

/**
 * Extract features from a check-in row
 * Uses cyclical encoding for temporal features (hour, day)
 * This ensures 11pm and midnight are treated as 1 hour apart, not 23 hours apart
 */
export function extractFeatures(row: CheckinRow): number[] {
  const date = new Date(row.created_at);
  const hour = date.getHours();
  const dow = date.getDay(); // day of week (0-6)
  const dom = date.getDate(); // day of month (1-31)

  // Cyclical encoding for hour (11pm and midnight stay close together)
  // Scale to 0-1 range for better neural network training
  const hour_sin = (Math.sin((2 * Math.PI * hour) / 24) + 1) / 2;
  const hour_cos = (Math.cos((2 * Math.PI * hour) / 24) + 1) / 2;

  // Cyclical encoding for day of week
  const day_sin = (Math.sin((2 * Math.PI * dow) / 7) + 1) / 2;
  const day_cos = (Math.cos((2 * Math.PI * dow) / 7) + 1) / 2;

  return [
    hour_sin, // 0-1
    hour_cos, // 0-1
    day_sin, // 0-1
    day_cos, // 0-1
    dom / 31, // day of month normalized (0-1)
    Math.min(row.tasks_done_last_2h / 10, 1), // task completion rate (0-1)
    Math.min(row.session_duration_mins / 240, 1), // session length normalized (0-1, max 4 hours)
    Math.min(row.mins_since_last_break / 90, 1), // break gap normalized (0-1, max 90 min)
  ];
}

/**
 * Train neural network on check-in history
 * Returns trained model or null if insufficient data
 */
export async function trainModel(
  checkinHistory: CheckinRow[]
): Promise<any | null> {
  // Check if ml5 is loaded
  if (typeof window === 'undefined' || typeof window.ml5 === 'undefined') {
    console.warn('KAAL: ml5.js not loaded, cannot train model');
    return null;
  }

  // Need at least 10 check-ins to train
  if (checkinHistory.length < 10) {
    console.log('KAAL: Not enough check-ins to train (need 10, have', checkinHistory.length, ')');
    return null;
  }

  try {
    // Create neural network
    const nn = window.ml5.neuralNetwork({
      inputs: 8,
      outputs: ['energy_1', 'energy_2', 'energy_3'],
      task: 'classification',
      debug: false,
    });

    // Add training data
    for (const row of checkinHistory) {
      nn.addData(extractFeatures(row), {
        energy_1: row.energy_level === 1 ? 1 : 0,
        energy_2: row.energy_level === 2 ? 1 : 0,
        energy_3: row.energy_level === 3 ? 1 : 0,
      });
    }

    // Normalize data for better training
    nn.normalizeData();

    // Train the model (runs in background via setTimeout to avoid blocking UI)
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        nn.train({ epochs: 50, batchSize: 8 }, () => resolve());
      }, 0);
    });

    // Save to localStorage — persists across sessions
    await new Promise<void>((resolve) => {
      nn.save('kaal_energy_model', () => resolve());
    });

    console.log('KAAL: Energy model trained successfully on', checkinHistory.length, 'check-ins');
    return nn;
  } catch (error) {
    console.error('KAAL: Error training model:', error);
    return null;
  }
}

/**
 * Predict energy level based on current context
 * Returns prediction with confidence or null if model not available
 */
export async function predictEnergy(
  currentContext: CurrentContext
): Promise<EnergyPrediction | null> {
  // Check if ml5 is loaded
  if (typeof window === 'undefined' || typeof window.ml5 === 'undefined') {
    return null;
  }

  // Check if model exists in localStorage
  try {
    if (!localStorage.getItem('kaal_energy_model_meta')) {
      return null;
    }
  } catch (error) {
    // localStorage not available
    return null;
  }

  try {
    // Create neural network with same architecture
    const nn = window.ml5.neuralNetwork({
      inputs: 8,
      outputs: ['energy_1', 'energy_2', 'energy_3'],
      task: 'classification',
      debug: false,
    });

    // Load saved model
    await new Promise<void>((resolve) => {
      nn.load('kaal_energy_model', () => resolve());
    });

    // Create fake row with current context
    const fakeRow: CheckinRow = {
      created_at: new Date().toISOString(),
      energy_level: 2, // placeholder, not used
      ...currentContext,
    };

    // Get prediction
    const results = await nn.classify(extractFeatures(fakeRow));

    // Results sorted descending by confidence
    const top = results[0];

    return {
      predicted_energy: parseInt(top.label.split('_')[1]) as 1 | 2 | 3,
      confidence: top.confidence,
    };
  } catch (error) {
    console.error('KAAL: Error predicting energy:', error);
    return null;
  }
}

/**
 * Get energy level label for display
 */
export function getEnergyLabel(level: 1 | 2 | 3): string {
  return level === 1 ? 'Low' : level === 2 ? 'Steady' : 'High';
}

/**
 * Get confidence level for display
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/**
 * Check if model exists in localStorage
 */
export function hasTrainedModel(): boolean {
  try {
    return !!localStorage.getItem('kaal_energy_model_meta');
  } catch {
    return false;
  }
}

/**
 * Clear trained model from localStorage
 */
export function clearModel(): void {
  try {
    localStorage.removeItem('kaal_energy_model_meta');
    localStorage.removeItem('kaal_energy_model_model');
    localStorage.removeItem('kaal_energy_model_weights');
    localStorage.removeItem('kaal_last_train_count');
    console.log('KAAL: Energy model cleared');
  } catch (error) {
    console.error('KAAL: Error clearing model:', error);
  }
}
