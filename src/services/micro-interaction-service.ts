/**
 * Micro-Interaction System
 * Smart, non-intrusive questions that build understanding of user patterns
 * 
 * Hybrid approach: Scheduled (morning/evening) + State-triggered (events)
 */

import { supabase } from './supabase-client';
import { Task } from './task-service';

export interface MicroInteraction {
  id: string;
  type: 'scheduled' | 'state_triggered' | 'celebration' | 'followup';
  trigger?: string;
  question: string;
  questionType: 'energy' | 'mood' | 'productivity' | 'task_feedback' | 'context' | 'why';
  responseType: 'yes_no' | 'emoji' | 'scale' | 'multi_choice' | 'text';
  options?: Array<{ value: string; label: string; emoji?: string }>;
  askedAt: Date;
  respondedAt?: Date;
  responseValue?: any;
  skipped: boolean;
  snoozedUntil?: Date;
  contextData?: any;
}

export interface InteractionResponse {
  interactionId: string;
  value: any;
  timestamp: Date;
}

class MicroInteractionService {
  private pendingInteractions: MicroInteraction[] = [];
  private lastInteractionTime: Date | null = null;
  private readonly MIN_MINUTES_BETWEEN = 15; // Minimum time between interactions

  /**
   * Generate scheduled micro-interactions (morning, evening)
   */
  async generateScheduledInteractions(userId: string): Promise<MicroInteraction[]> {
    const now = new Date();
    const hour = now.getHours();
    const interactions: MicroInteraction[] = [];

    // Morning check-in (7-10 AM)
    if (hour >= 7 && hour < 10) {
      const morningCheck = await this.getRecentInteraction(userId, 'morning_energy');
      if (!morningCheck) {
        interactions.push({
          id: crypto.randomUUID(),
          type: 'scheduled',
          trigger: 'morning_energy',
          question: "How's your energy this morning?",
          questionType: 'energy',
          responseType: 'emoji',
          options: [
            { value: '1', label: 'Drained', emoji: '😴' },
            { value: '2', label: 'Tired', emoji: '😐' },
            { value: '3', label: 'OK', emoji: '🙂' },
            { value: '4', label: 'Good', emoji: '😊' },
            { value: '5', label: 'Energized', emoji: '⚡' },
          ],
          askedAt: now,
          skipped: false,
        });
      }
    }

    // Mid-day pulse (12-1 PM)
    if (hour >= 12 && hour < 13) {
      const middayCheck = await this.getRecentInteraction(userId, 'midday_pulse');
      if (!middayCheck) {
        interactions.push({
          id: crypto.randomUUID(),
          type: 'scheduled',
          trigger: 'midday_pulse',
          question: 'Still in the zone?',
          questionType: 'productivity',
          responseType: 'yes_no',
          options: [
            { value: 'yes', label: 'Yes, crushing it! 🎯', emoji: '🎯' },
            { value: 'break', label: 'Need a break ☕', emoji: '☕' },
          ],
          askedAt: now,
          skipped: false,
        });
      }
    }

    // Afternoon dip check (2-3 PM)
    if (hour >= 14 && hour < 15) {
      const afternoonCheck = await this.getRecentInteraction(userId, 'afternoon_dip');
      if (!afternoonCheck) {
        interactions.push({
          id: crypto.randomUUID(),
          type: 'scheduled',
          trigger: 'afternoon_dip',
          question: 'Afternoon slump?',
          questionType: 'energy',
          responseType: 'multi_choice',
          options: [
            { value: 'coffee', label: 'Getting coffee', emoji: '☕' },
            { value: 'going', label: 'Still going strong', emoji: '🚀' },
            { value: 'break', label: 'Taking a break', emoji: '🧘' },
          ],
          askedAt: now,
          skipped: false,
        });
      }
    }

    // End-of-day reflection (6-8 PM)
    if (hour >= 18 && hour < 20) {
      const eveningCheck = await this.getRecentInteraction(userId, 'evening_reflection');
      if (!eveningCheck) {
        interactions.push({
          id: crypto.randomUUID(),
          type: 'scheduled',
          trigger: 'evening_reflection',
          question: 'How productive was today?',
          questionType: 'productivity',
          responseType: 'scale',
          options: [
            { value: '1', label: '1 ⭐' },
            { value: '2', label: '2 ⭐⭐' },
            { value: '3', label: '3 ⭐⭐⭐' },
            { value: '4', label: '4 ⭐⭐⭐⭐' },
            { value: '5', label: '5 ⭐⭐⭐⭐⭐' },
          ],
          askedAt: now,
          skipped: false,
        });
      }
    }

    // Save to database
    if (interactions.length > 0) {
      await this.saveInteractions(userId, interactions);
    }

    return interactions;
  }

  /**
   * Generate state-triggered interactions
   */
  async generateStateTriggeredInteraction(
    userId: string,
    trigger: string,
    contextData: any
  ): Promise<MicroInteraction | null> {
    // Check rate limiting
    if (!this.canShowInteraction()) {
      return null;
    }

    let interaction: MicroInteraction | null = null;

    switch (trigger) {
      case 'task_completed':
        interaction = {
          id: crypto.randomUUID(),
          type: 'state_triggered',
          trigger,
          question: 'How was that task?',
          questionType: 'task_feedback',
          responseType: 'multi_choice',
          options: [
            { value: 'easy', label: 'Easier than expected 😌', emoji: '😌' },
            { value: 'expected', label: 'As expected ✅', emoji: '✅' },
            { value: 'hard', label: 'Harder than expected 😰', emoji: '😰' },
          ],
          askedAt: new Date(),
          skipped: false,
          contextData,
        };
        break;

      case 'rapid_completions':
        interaction = {
          id: crypto.randomUUID(),
          type: 'celebration',
          trigger,
          question: "You're on fire! 🔥 What's fueling you?",
          questionType: 'why',
          responseType: 'multi_choice',
          options: [
            { value: 'coffee', label: '☕ Coffee', emoji: '☕' },
            { value: 'music', label: '🎵 Good music', emoji: '🎵' },
            { value: 'sleep', label: '😴 Slept well', emoji: '😴' },
            { value: 'motivated', label: '🔥 Just motivated', emoji: '🔥' },
            { value: 'deadline', label: '⏰ Deadline pressure', emoji: '⏰' },
          ],
          askedAt: new Date(),
          skipped: false,
          contextData,
        };
        break;

      case 'long_inactivity':
        interaction = {
          id: crypto.randomUUID(),
          type: 'state_triggered',
          trigger,
          question: 'Taking a break?',
          questionType: 'context',
          responseType: 'yes_no',
          options: [
            { value: 'short', label: 'Quick break (back soon)', emoji: '☕' },
            { value: 'long', label: 'Long break (done for now)', emoji: '🚶' },
          ],
          askedAt: new Date(),
          skipped: false,
          contextData,
        };
        break;

      case 'energy_drop':
        interaction = {
          id: crypto.randomUUID(),
          type: 'state_triggered',
          trigger,
          question: 'Feeling drained?',
          questionType: 'energy',
          responseType: 'yes_no',
          options: [
            { value: 'yes', label: 'Yes, need a break', emoji: '😴' },
            { value: 'no', label: "No, I'm good", emoji: '💪' },
          ],
          askedAt: new Date(),
          skipped: false,
          contextData,
        };
        break;

      case 'streak_milestone':
        interaction = {
          id: crypto.randomUUID(),
          type: 'celebration',
          trigger,
          question: `${contextData.milestone} day streak! 🎉 How do you feel?`,
          questionType: 'mood',
          responseType: 'emoji',
          options: [
            { value: 'proud', label: 'Proud', emoji: '😊' },
            { value: 'motivated', label: 'Motivated', emoji: '🔥' },
            { value: 'normal', label: 'Normal', emoji: '😐' },
          ],
          askedAt: new Date(),
          skipped: false,
          contextData,
        };
        break;
    }

    if (interaction) {
      await this.saveInteractions(userId, [interaction]);
      this.lastInteractionTime = new Date();
    }

    return interaction;
  }

  /**
   * Respond to micro-interaction
   */
  async respondToInteraction(
    userId: string,
    interactionId: string,
    value: any
  ): Promise<void> {
    const now = new Date();

    const { error } = await supabase
      .from('micro_interactions')
      .update({
        response_value: value,
        responded_at: now.toISOString(),
      })
      .eq('id', interactionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error responding to interaction:', error);
      throw error;
    }

    // Update streak if it's a scheduled check-in
    const interaction = await this.getInteraction(interactionId);
    if (interaction && interaction.type === 'scheduled') {
      await this.updateStreak(userId, 'daily_checkin');
    }
  }

  /**
   * Skip interaction
   */
  async skipInteraction(userId: string, interactionId: string): Promise<void> {
    const { error } = await supabase
      .from('micro_interactions')
      .update({ skipped: true })
      .eq('id', interactionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error skipping interaction:', error);
    }
  }

  /**
   * Snooze interaction (ask again in X minutes)
   */
  async snoozeInteraction(
    userId: string,
    interactionId: string,
    minutes: number = 15
  ): Promise<void> {
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

    const { error } = await supabase
      .from('micro_interactions')
      .update({ snoozed_until: snoozeUntil.toISOString() })
      .eq('id', interactionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error snoozing interaction:', error);
    }
  }

  /**
   * Get pending interactions for user
   */
  async getPendingInteractions(userId: string): Promise<MicroInteraction[]> {
    const now = new Date();

    const { data, error } = await supabase
      .from('micro_interactions')
      .select('*')
      .eq('user_id', userId)
      .is('responded_at', null)
      .eq('skipped', false)
      .or(`snoozed_until.is.null,snoozed_until.lt.${now.toISOString()}`)
      .order('asked_at', { ascending: false })
      .limit(5);

    if (error) {
      // Table doesn't exist yet - migrations not run
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message.includes('Could not find')) {
        // Silent mode: Only log in debug mode
        if (false) { // debug logging removed — no import.meta.env in Figma Make
          console.info('ℹ️ Micro-interactions: Database table not found (optional feature)');
        }
        return [];
      }
      console.error('Error fetching pending interactions:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      type: row.type,
      trigger: row.trigger,
      question: row.question,
      questionType: row.question_type,
      responseType: row.response_type,
      options: this.getOptionsForInteraction(row),
      askedAt: new Date(row.asked_at),
      respondedAt: row.responded_at ? new Date(row.responded_at) : undefined,
      responseValue: row.response_value,
      skipped: row.skipped,
      snoozedUntil: row.snoozed_until ? new Date(row.snoozed_until) : undefined,
      contextData: row.context_data,
    }));
  }

  /**
   * Analyze user patterns from micro-interactions
   */
  async analyzePatterns(userId: string): Promise<{
    morningEnergyAvg: number;
    afternoonDipTime: number | null;
    productiveHours: number[];
    energyDrivers: Array<{ driver: string; frequency: number }>;
  }> {
    const { data, error } = await supabase
      .from('micro_interactions')
      .select('*')
      .eq('user_id', userId)
      .not('responded_at', 'is', null)
      .gte('asked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (error || !data) {
      return {
        morningEnergyAvg: 3,
        afternoonDipTime: 14,
        productiveHours: [9, 10, 11, 14, 15],
        energyDrivers: [],
      };
    }

    // Calculate morning energy average
    const morningEnergy = data
      .filter((i) => i.trigger === 'morning_energy' && i.response_value)
      .map((i) => parseInt(i.response_value.value || i.response_value));
    const morningEnergyAvg = morningEnergy.length > 0
      ? morningEnergy.reduce((a, b) => a + b, 0) / morningEnergy.length
      : 3;

    // Identify afternoon dip time (when users report low energy)
    const afternoonChecks = data.filter((i) => i.trigger === 'afternoon_dip');
    const afternoonDipTime = afternoonChecks.length > 0 ? 14 : null; // Default 2 PM

    // Productive hours (when users report high productivity)
    const productivityReports = data.filter(
      (i) => i.question_type === 'productivity' && i.response_value
    );
    const productiveHours = [9, 10, 11, 14, 15]; // Default

    // Energy drivers (what makes users productive)
    const whyAnswers = data.filter((i) => i.question_type === 'why' && i.response_value);
    const driverCounts: { [key: string]: number } = {};
    whyAnswers.forEach((i) => {
      const driver = i.response_value.value || i.response_value;
      driverCounts[driver] = (driverCounts[driver] || 0) + 1;
    });
    const energyDrivers = Object.entries(driverCounts)
      .map(([driver, frequency]) => ({ driver, frequency }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      morningEnergyAvg,
      afternoonDipTime,
      productiveHours,
      energyDrivers,
    };
  }

  // Helper methods

  private async getRecentInteraction(userId: string, trigger: string): Promise<boolean> {
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    const { data, error } = await supabase
      .from('micro_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('trigger', trigger)
      .gte('asked_at', threeHoursAgo.toISOString())
      .limit(1);

    if (error) {
      // Table doesn't exist - return false (no recent interaction)
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message.includes('Could not find')) {
        return false;
      }
    }

    return (data || []).length > 0;
  }

  private canShowInteraction(): boolean {
    if (!this.lastInteractionTime) return true;

    const now = new Date();
    const minutesSinceLastInteraction = (now.getTime() - this.lastInteractionTime.getTime()) / (1000 * 60);

    return minutesSinceLastInteraction >= this.MIN_MINUTES_BETWEEN;
  }

  private async saveInteractions(userId: string, interactions: MicroInteraction[]): Promise<void> {
    const inserts = interactions.map((i) => ({
      user_id: userId,
      type: i.type,
      trigger: i.trigger,
      question: i.question,
      question_type: i.questionType,
      response_type: i.responseType,
      asked_at: i.askedAt.toISOString(),
      skipped: i.skipped,
      context_data: i.contextData,
    }));

    const { error } = await supabase.from('micro_interactions').insert(inserts);

    if (error) {
      console.error('Error saving interactions:', error);
    }
  }

  private async getInteraction(interactionId: string): Promise<MicroInteraction | null> {
    const { data } = await supabase
      .from('micro_interactions')
      .select('*')
      .eq('id', interactionId)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      type: data.type,
      trigger: data.trigger,
      question: data.question,
      questionType: data.question_type,
      responseType: data.response_type,
      askedAt: new Date(data.asked_at),
      skipped: data.skipped,
    };
  }

  private getOptionsForInteraction(row: any): any[] {
    // Options are predefined based on trigger type
    // In production, these could be stored in database
    return [];
  }

  private async updateStreak(userId: string, streakType: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await supabase.rpc('update_user_streak', {
      p_user_id: userId,
      p_streak_type: streakType,
      p_activity_date: today,
    });
  }
}

export const microInteractions = new MicroInteractionService();