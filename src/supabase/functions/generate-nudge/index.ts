/**
 * KAAL AI Nudge Generation
 * 
 * Supabase Edge Function — server-side only
 * Calls Google Gemini API to generate personalized nudge messages
 * 
 * NEVER expose GEMINI_API_KEY to the browser
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

interface NudgeRequest {
  task_title: string;
  estimated_minutes: number;
  nudge_type: string;
  energy_level: number;
  cognitive_mode: string;
  tasks_done_today: number;
  minutes_overdue: number;
  history_hint: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Check API key is configured
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'AI service not configured',
          fallback: true,
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Parse request body
    const body: NudgeRequest = await req.json();
    const {
      task_title,
      estimated_minutes,
      nudge_type,
      energy_level,
      cognitive_mode,
      tasks_done_today,
      minutes_overdue,
      history_hint,
    } = body;

    // Validate required fields
    if (!task_title || !nudge_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Build prompt with system context
    const prompt = `You are KAAL, a proactive AI life OS designed for people with ADHD and executive dysfunction.

CRITICAL REQUIREMENTS - You MUST follow these rules STRICTLY:
1. Write EXACTLY 1-2 complete, grammatically correct sentences
2. Use PROPER grammar with correct comma placement
3. Required commas: After introductory phrases, before coordinating conjunctions (and, but, or, so) connecting independent clauses, around non-essential information
4. End with EXACTLY ONE period or question mark
5. NO emojis, NO quotation marks, NO asterisks, NO markdown
6. Write in plain English only - no formatting symbols
7. CAPITALIZE the first letter of the sentence
8. Use proper capitalization throughout

GRAMMAR EXAMPLES OF WHAT TO DO:
✓ "${task_title} is ready when you are, and starting now protects your afternoon."
✓ "You've completed ${tasks_done_today} tasks today, so you're building momentum."
✓ "Starting ${task_title} now, while your energy is high, sets you up for success."

GRAMMAR EXAMPLES OF WHAT NOT TO DO:
✗ "${task_title} is ready when you are and starting now protects your afternoon" (missing comma before "and")
✗ "youve completed tasks today so youre building momentum" (missing apostrophes and commas)
✗ "${task_title} is ready 🚀" (emoji not allowed)
✗ **Start now** (markdown not allowed)

Your nudge message should be:
- Specific to the actual task "${task_title}" (never generic phrases like "you got this" or "just do it")
- Tone-matched to energy level: low energy = gentle and understanding, high energy = direct and confident
- Actionable and concrete with one clear next step
- Empathetic but not condescending
- Grammatically perfect with correct punctuation

CONTEXT:
Task: ${task_title} (estimated ${estimated_minutes || 25} minutes)
User energy: ${energy_level}/3 (1=low, 2=medium, 3=high)
Cognitive mode: ${cognitive_mode || 'unknown'}
Minutes overdue: ${minutes_overdue}
Tasks completed today: ${tasks_done_today}
Nudge type: ${nudge_type}
Behavioral pattern: ${history_hint}

Write ONLY the nudge message (1-2 sentences, grammatically perfect, proper comma usage):`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: 120,
            temperature: 0.7,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      
      // Return fallback message
      return new Response(
        JSON.stringify({
          message: getFallbackMessage(nudge_type, task_title),
          fallback: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const data = await geminiResponse.json();
    const rawMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackMessage(nudge_type, task_title);
    
    // Clean and validate the message
    const cleanedMessage = cleanAndValidateMessage(rawMessage, nudge_type, task_title);

    return new Response(
      JSON.stringify({ message: cleanedMessage, fallback: false }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error generating nudge:', error);
    
    return new Response(
      JSON.stringify({
        message: 'Your next task is waiting. What is one small step you can take right now?',
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

/**
 * Fallback messages when AI is unavailable
 */
function getFallbackMessage(nudgeType: string, taskTitle: string): string {
  const fallbacks: Record<string, string> = {
    gentle: `${taskTitle} is ready when you are. What would make starting easier right now?`,
    active: `${taskTitle} has been waiting. Starting now protects the rest of your day.`,
    intervention: `${taskTitle} needs your attention. Time to make a decision: start it or reschedule it.`,
    context_switch: `Your energy has shifted. Here's a better-matched task for right now.`,
    break_reminder: `You've been focused for over 90 minutes. A short break improves output.`,
  };

  return fallbacks[nudgeType] || 'Your next task is waiting. What is one small step you can take right now?';
}

/**
 * Clean and validate the message to ensure it meets the requirements
 */
function cleanAndValidateMessage(message: string, nudgeType: string, taskTitle: string): string {
  // Remove any leading or trailing whitespace
  let cleaned = message.trim();

  // Remove quotation marks if present
  cleaned = cleaned.replace(/^[\"']|[\"']$/g, '');
  
  // Remove markdown formatting
  cleaned = cleaned.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '');
  
  // Remove emojis (comprehensive emoji removal)
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // Validate: check if message is empty or too short after cleaning
  if (!cleaned || cleaned.length < 10) {
    console.warn('Message too short after cleaning:', cleaned);
    return getFallbackMessage(nudgeType, taskTitle);
  }

  // Validate: check if message is too long
  if (cleaned.length > 300) {
    console.warn('Message too long:', cleaned.length);
    return getFallbackMessage(nudgeType, taskTitle);
  }

  // Check for basic grammar requirements
  const grammarIssues = checkGrammarIssues(cleaned);
  if (grammarIssues.length > 0) {
    console.warn('Grammar issues detected:', grammarIssues);
    // Try to fix common issues, otherwise return fallback
    cleaned = fixCommonGrammarIssues(cleaned);
    
    // If still has issues after fixing, use fallback
    const remainingIssues = checkGrammarIssues(cleaned);
    if (remainingIssues.length > 2) {
      console.warn('Too many grammar issues remaining, using fallback');
      return getFallbackMessage(nudgeType, taskTitle);
    }
  }

  // Ensure proper ending punctuation
  if (!cleaned.endsWith('.') && !cleaned.endsWith('?') && !cleaned.endsWith('!')) {
    cleaned += '.';
  }

  // Capitalize first letter
  if (cleaned.length > 0 && cleaned[0] === cleaned[0].toLowerCase()) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Check for common grammar issues
 */
function checkGrammarIssues(text: string): string[] {
  const issues: string[] = [];

  // Check for coordinating conjunctions without commas
  // Pattern: word + (and|but|or|so) + word (where both are likely independent clauses)
  const coordinatingConjunctions = /\s+(and|but|or|so)\s+/gi;
  const matches = text.matchAll(coordinatingConjunctions);
  
  for (const match of matches) {
    const index = match.index || 0;
    // Check if there's a comma before the conjunction
    if (index > 0 && text[index - 1] !== ',') {
      // Simple heuristic: if there are words before and after, likely needs comma
      const beforeText = text.slice(0, index).trim();
      const afterText = text.slice(index + match[0].length).trim();
      
      // If both parts have verbs (very simple check), likely needs comma
      if (beforeText.split(' ').length >= 3 && afterText.split(' ').length >= 3) {
        issues.push(`Missing comma before "${match[1]}"`);
      }
    }
  }

  // Check for multiple sentences without proper ending
  const sentenceCount = (text.match(/[.!?]/g) || []).length;
  const words = text.split(/\s+/).length;
  if (words > 20 && sentenceCount === 0) {
    issues.push('Missing sentence punctuation');
  }

  // Check for common contractions that might be missing apostrophes
  const contractionPatterns = [
    /\byouve\b/i,
    /\byoure\b/i,
    /\btheyre\b/i,
    /\bits\s+(a|the|your)/i, // "its a" should be "it's a"
    /\bdont\b/i,
    /\bcant\b/i,
    /\bwont\b/i,
    /\bisnt\b/i,
  ];

  for (const pattern of contractionPatterns) {
    if (pattern.test(text)) {
      issues.push('Missing apostrophe in contraction');
      break; // Only report once
    }
  }

  return issues;
}

/**
 * Fix common grammar issues
 */
function fixCommonGrammarIssues(text: string): string {
  let fixed = text;

  // Fix common contractions
  fixed = fixed.replace(/\byouve\b/gi, "you've");
  fixed = fixed.replace(/\byoure\b/gi, "you're");
  fixed = fixed.replace(/\btheyre\b/gi, "they're");
  fixed = fixed.replace(/\bdont\b/gi, "don't");
  fixed = fixed.replace(/\bcant\b/gi, "can't");
  fixed = fixed.replace(/\bwont\b/gi, "won't");
  fixed = fixed.replace(/\bisnt\b/gi, "isn't");
  fixed = fixed.replace(/\bwasnt\b/gi, "wasn't");
  fixed = fixed.replace(/\bwerent\b/gi, "weren't");
  fixed = fixed.replace(/\bdidnt\b/gi, "didn't");
  fixed = fixed.replace(/\bwouldnt\b/gi, "wouldn't");
  fixed = fixed.replace(/\bcouldnt\b/gi, "couldn't");
  fixed = fixed.replace(/\bshouldnt\b/gi, "shouldn't");

  // Fix "its" when it should be "it's" (possessive vs contraction)
  // "its a", "its your", "its the" -> "it's a", "it's your", "it's the"
  fixed = fixed.replace(/\bits\s+(a|an|the|your|my|our|been|time|ready)/gi, (match, word) => {
    return `it's ${word}`;
  });

  // Add comma before coordinating conjunctions in compound sentences (simple heuristic)
  // This is a basic fix - look for patterns like "word word and word word"
  const coordinatingConjunctions = ['and', 'but', 'or', 'so'];
  
  for (const conj of coordinatingConjunctions) {
    // Pattern: multiple words, conjunction without comma, multiple words after
    const pattern = new RegExp(`([a-z]+\\s+[a-z]+)\\s+(${conj})\\s+([a-z]+\\s+[a-z]+)`, 'gi');
    
    fixed = fixed.replace(pattern, (match, before, conjunction, after) => {
      // Check if there's already a comma
      if (before.endsWith(',')) {
        return match;
      }
      // Add comma before conjunction
      return `${before}, ${conjunction} ${after}`;
    });
  }

  return fixed;
}