/**
 * agent.ts — GharSoch voice agent tools (TS port of voice_agent.py's BrokerAssistant).
 *
 * Every business tool calls lib/voice/toolRouter.dispatchVoiceTool IN-PROCESS —
 * the same logic the HTTP tool routes use — so:
 *   book_appointment   → appointmentService.create → conflict policy + Google Calendar + WhatsApp
 *   log_call_outcome   → call record + lead status/score updates
 *   request_callback   → lead next_follow_up_date (Follow-Up agent picks it up)
 *   mark_wrong_number / handle_dispute / acknowledge_existing_customer → DNC & status flows
 * and every dispatch records a tool event on the call doc (visible in Call Review).
 */
import { llm, shortuuid } from '@livekit/agents'
import { z } from 'zod'
import { dispatchVoiceTool } from '@/lib/voice/toolRouter'
import type { SarvamSTT } from './sarvam/stt'
import type { SarvamTTS } from './sarvam/tts'
import { CLOSING_REMARKS, GOODBYE_TEXTS, VALID_OUTCOMES } from './constants'

export interface ToolDeps {
  voiceCallId: string
  roomName: string
  metadata: Record<string, any>
  customerName: string
  customerPhone: string
  stt: SarvamSTT
  tts: SarvamTTS
  /** Schedule call teardown after `delaySeconds` (idempotent). */
  hangup: (delaySeconds: number) => void
}

async function callBusinessTool(deps: ToolDeps, toolName: string, args: Record<string, any>): Promise<string> {
  // gpt-4o-mini frequently sends null for omitted optional fields — drop them so
  // downstream business logic sees clean, absent values.
  const cleanArgs = Object.fromEntries(Object.entries(args || {}).filter(([, v]) => v !== null && v !== undefined))
  try {
    const result = await dispatchVoiceTool({
      toolCallId: shortuuid(),
      toolName,
      args: cleanArgs,
      metadata: deps.metadata,
      voiceCallId: deps.voiceCallId,
      roomName: deps.roomName,
    })
    return typeof result === 'string' ? result : JSON.stringify(result)
  } catch (err) {
    console.error(`[voice-agent] tool ${toolName} failed:`, (err as Error).message)
    return `Tool failed: ${(err as Error).message}`
  }
}

const LANGUAGE_CONFIG: Record<string, { display: string; code: string }> = {
  hindi: { display: 'Hindi', code: 'hi-IN' },
  english: { display: 'English', code: 'en-IN' },
  marathi: { display: 'Marathi', code: 'mr-IN' },
  hinglish: { display: 'Hindi-English mix (Hinglish)', code: 'hi-IN' },
  marathienglish: { display: 'Marathi-English mix', code: 'mr-IN' },
}

export function buildTools(deps: ToolDeps): llm.ToolContext {
  return {
    book_appointment: llm.tool({
      description:
        'Book a site-visit/office appointment. Call ONLY AFTER the customer explicitly agrees to a specific day and time. ' +
        'Provide preferred_date (e.g. "2026-06-12" or "Saturday") and preferred_time (e.g. "11 AM"), or scheduled_at as ISO datetime.',
      parameters: z.object({
        scheduled_at: z.string().nullish().describe('ISO datetime if known, e.g. 2026-06-12T11:00:00+05:30'),
        preferred_date: z.string().nullish().describe('Date the customer confirmed, e.g. "2026-06-12" or "kal" resolved to a date'),
        preferred_time: z.string().nullish().describe('Time the customer confirmed, e.g. "11 AM"'),
        slot_chosen: z.string().nullish().describe('The slot in the customer\'s words, e.g. "Saturday 11 baje"'),
        notes: z.string().nullish().describe('Extra booking context'),
      }),
      execute: async (args) => {
        const result = await callBusinessTool(deps, 'book_appointment', args)
        return result
      },
    }),

    check_availability: llm.tool({
      description: 'Check which appointment slots are free for a given day BEFORE proposing times to the customer.',
      parameters: z.object({
        preferred_day: z.string().nullish().describe('Day to check, e.g. "tomorrow", "Saturday", "2026-06-12"'),
      }),
      execute: async (args) => callBusinessTool(deps, 'check_availability', args),
    }),

    search_properties: llm.tool({
      description:
        'Search live property inventory when the customer asks what options exist, or to find alternatives ' +
        'matching their budget/location/type. Use the results to pitch — never invent properties.',
      parameters: z.object({
        location: z.string().nullish().describe('Area/city the customer wants, e.g. "Andheri", "Ahmedabad"'),
        property_type: z.string().nullish().describe('e.g. "2BHK", "3BHK", "Villa"'),
        max_budget_lakhs: z.number().nullish().describe('Maximum budget in lakhs, e.g. 75'),
      }),
      execute: async (args) => callBusinessTool(deps, 'search_properties', args),
    }),

    reschedule_appointment: llm.tool({
      description:
        'Move the customer\'s EXISTING upcoming appointment to a new day/time. Use when they say they cannot make it ' +
        'but want a different slot. Call ONLY after they confirm the new day and time.',
      parameters: z.object({
        preferred_date: z.string().nullish().describe('New date, e.g. "2026-06-14" or "Sunday"'),
        preferred_time: z.string().nullish().describe('New time, e.g. "11 AM"'),
        scheduled_at: z.string().nullish().describe('New ISO datetime if known'),
        notes: z.string().nullish(),
      }),
      execute: async (args) => callBusinessTool(deps, 'reschedule_appointment', args),
    }),

    cancel_appointment: llm.tool({
      description:
        'Cancel the customer\'s existing upcoming appointment when they clearly do not want to come and do not want ' +
        'a new slot. Offer to reschedule FIRST; cancel only if they refuse.',
      parameters: z.object({
        reason: z.string().nullish().describe('Why they are cancelling, in brief'),
      }),
      execute: async (args) => callBusinessTool(deps, 'cancel_appointment', args),
    }),

    confirm_appointment: llm.tool({
      description:
        'Mark the customer\'s upcoming appointment as CONFIRMED when they say yes, they will come ' +
        '(reminder-call flow). Do not use for new bookings — that is book_appointment.',
      parameters: z.object({
        notes: z.string().nullish(),
      }),
      execute: async (args) => callBusinessTool(deps, 'confirm_appointment', args),
    }),

    calculate_affordability: llm.tool({
      description:
        'Calculate the approximate monthly EMI and whether the property fits the customer\'s budget. ' +
        'Use when they ask about EMI, loan, or "can I afford it". The backend does ALL math — speak its result, never compute yourself.',
      parameters: z.object({
        property_price_lakhs: z.number().describe('Property price in lakhs, e.g. 75'),
        down_payment_lakhs: z.number().nullish().describe('Down payment in lakhs'),
        monthly_income: z.number().nullish().describe('Customer monthly income in rupees, if shared'),
        existing_emi: z.number().nullish().describe('Existing EMIs in rupees/month, if shared'),
        tenure_years: z.number().nullish().describe('Loan tenure in years (default 20)'),
      }),
      execute: async (args) => callBusinessTool(deps, 'calculate_affordability', args),
    }),

    log_objection: llm.tool({
      description:
        'Log a specific objection the customer raised (price, location, timing, family decision, financing, ' +
        'competition, possession timeline). Call once per distinct objection — this powers follow-up targeting.',
      parameters: z.object({
        category: z.enum(['price', 'location', 'family_decision', 'timing', 'financing', 'competition', 'possession_timeline', 'other']),
        details: z.string().nullish().describe('What exactly they said, in brief'),
      }),
      execute: async (args) => callBusinessTool(deps, 'log_objection', args),
    }),

    flag_escalation: llm.tool({
      description:
        'Flag the call for HUMAN broker follow-up when the customer explicitly asks to speak to a person, is a very ' +
        'hot lead needing personal attention, or raises something you cannot resolve. Tell them the broker will call back.',
      parameters: z.object({
        reason: z.string().describe('Why human attention is needed'),
        urgency: z.enum(['high', 'medium', 'low']).nullish(),
      }),
      execute: async (args) => callBusinessTool(deps, 'flag_escalation', args),
    }),

    request_callback: llm.tool({
      description:
        'Capture a callback request when the customer is busy/driving and wants to be called later ' +
        '(e.g. "abhi busy hoon, shaam ko call karo").',
      parameters: z.object({
        callback_time: z.string().describe('When to call back, in the customer\'s words, e.g. "shaam 6 baje", "kal subah"'),
        notes: z.string().nullish(),
      }),
      execute: async (args) => callBusinessTool(deps, 'request_callback', args),
    }),

    mark_wrong_number: llm.tool({
      description:
        'Call when the person says it is a wrong number or they are NOT the intended customer. Logs it and ends the call.',
      parameters: z.object({ notes: z.string().nullish() }),
      execute: async (args) => {
        const result = await callBusinessTool(deps, 'mark_wrong_number', args)
        deps.hangup(3)
        return result + ' Call ending.'
      },
    }),

    handle_dispute: llm.tool({
      description:
        'Call IMMEDIATELY when the customer raises a privacy complaint or legal/police threat. ' +
        'Logs DNC and ends the call after ONE apology. Do NOT keep arguing.',
      parameters: z.object({
        dispute_type: z.string().describe('e.g. privacy_complaint, legal_threat, police_threat'),
        notes: z.string().nullish(),
      }),
      execute: async (args) => {
        await callBusinessTool(deps, 'handle_dispute', {
          ...args,
          notes: `DISPUTE/${args.dispute_type}: ${args.notes || ''}`,
        })
        deps.hangup(5)
        return (
          'Dispute logged, number marked DNC. Say ONE short apology and goodbye ONLY, then STOP: ' +
          "'जी, माफ़ कीजिए। आपका number remove कर दिया है, दोबारा call नहीं आएगी। धन्यवाद।' The call will disconnect."
        )
      },
    }),

    acknowledge_existing_customer: llm.tool({
      description:
        'Call when the customer says they ALREADY visited the office / booked / are dealing with the agency, so you do not re-pitch.',
      parameters: z.object({
        status: z.string().describe('e.g. already_visited, already_booked, already_met'),
        notes: z.string().nullish(),
      }),
      execute: async (args) => {
        await callBusinessTool(deps, 'acknowledge_existing_customer', args)
        return (
          'Existing customer acknowledged. Do NOT pitch the office visit again — warmly acknowledge, ' +
          'ask if they need anything else, then thank them and end the call.'
        )
      },
    }),

    initiate_closing: llm.tool({
      description:
        'Call this when the main objective is done (appointment booked, callback set, customer decided) ' +
        'AND you are ready to close the conversation. This triggers the 3-step closing ritual: ' +
        '1) check if they need anything else, 2) outcome-specific warm remark, 3) goodbye → tools. ' +
        'ALWAYS call this before save_conversation_summary and log_call_outcome. ' +
        'Do NOT call this before the customer has spoken or mid-conversation.',
      parameters: z.object({
        outcome_so_far: z.enum(VALID_OUTCOMES as unknown as [string, ...string[]]).describe(
          'The outcome of this call so far, used to pick the right closing remark.'
        ),
        language: z.string().nullish().describe('Current language code, e.g. hi-IN, en-IN, mr-IN'),
      }),
      execute: async (args) => {
        const lang = (args.language || deps.tts.currentLanguage || 'hi-IN') as string
        const langKey = (['hi-IN', 'mr-IN', 'en-IN', 'hi-EN'].includes(lang) ? lang : 'hi-IN') as string

        // Pick outcome-specific remark, fallback to default
        const remarkMap = CLOSING_REMARKS[args.outcome_so_far] || CLOSING_REMARKS['default']!
        const remark = remarkMap[langKey] || remarkMap['hi-IN']!

        // Pick goodbye line
        const goodbye = GOODBYE_TEXTS[langKey] || GOODBYE_TEXTS['hi-IN']!

        return (
          `CLOSING RITUAL — follow these steps exactly, in order:\n` +
          `STEP 1 — Say this check-in line aloud and WAIT for the customer's response:\n` +
          `  ${langKey === 'en-IN' ? 'Is there anything else I can help you with?' : 'और कोई सवाल था जी? कुछ और पूछना था?'}\n` +
          `  If they have a question, answer it, then come back to Step 2.\n\n` +
          `STEP 2 — Say this closing remark aloud:\n` +
          `  "${remark}"\n\n` +
          `STEP 3 — Say this goodbye line aloud:\n` +
          `  "${goodbye}"\n\n` +
          `STEP 4 — Call tools in this exact order: save_conversation_summary → log_call_outcome → end_call.\n` +
          `Do NOT say anything after end_call.`
        )
      },
    }),

    save_conversation_summary: llm.tool({
      description:
        'Save a summary of this conversation for future calls. Call BEFORE log_call_outcome to capture key details.',
      parameters: z.object({
        summary: z.string().describe('1-2 sentence summary of what was discussed'),
        outcome: z.string().describe('Provisional outcome'),
        budget: z.string().nullish(),
        preferred_location: z.string().nullish(),
        property_type: z.string().nullish(),
        timeline: z.string().nullish(),
        notes: z.string().nullish(),
      }),
      execute: async (args) => callBusinessTool(deps, 'save_conversation_summary', args),
    }),

    log_call_outcome: llm.tool({
      description:
        'Log the final call outcome. Call this AFTER you have said your closing remarks and goodbye. ' +
        `Outcome must be one of: ${VALID_OUTCOMES.join(', ')}. ` +
        'IMPORTANT: After this tool returns, say your final goodbye line aloud, THEN call end_call. ' +
        'Do NOT rush — let the customer hear your full goodbye before the call disconnects.',
      parameters: z.object({
        outcome: z.enum(VALID_OUTCOMES as unknown as [string, ...string[]]),
        notes: z.string().nullish().describe('Brief conversation summary'),
      }),
      execute: async (args) => {
        const result = await callBusinessTool(deps, 'log_call_outcome', args)
        const lang = deps.tts.currentLanguage || 'hi-IN'
        const langKey = (['hi-IN', 'mr-IN', 'en-IN', 'hi-EN'].includes(lang) ? lang : 'hi-IN') as string
        const goodbye = GOODBYE_TEXTS[langKey] || GOODBYE_TEXTS['hi-IN']!
        // Do NOT call hangup here — let the LLM speak the goodbye first,
        // then call end_call which triggers the graceful disconnect.
        return (
          result +
          ` Outcome logged successfully. Now say this goodbye aloud to the customer: "${goodbye}" — ` +
          `wait for them to respond or stay silent for 2 seconds, then call end_call.`
        )
      },
    }),

    end_call: llm.tool({
      description:
        'Gracefully end and disconnect the call AFTER you have spoken your final goodbye aloud ' +
        'and AFTER log_call_outcome. The call will stay connected for a few more seconds so ' +
        'the customer hears your complete goodbye. Do not say anything after calling this.',
      parameters: z.object({ reason: z.string().describe('e.g. appointment booked, customer said bye') }),
      execute: async (args) => {
        console.log(`[voice-agent] end_call: ${args.reason}`)
        // Give 15 seconds — the hangup function will wait for TTS playout
        // before actually disconnecting, so the customer hears the full goodbye.
        deps.hangup(15)
        return 'Call will disconnect after your goodbye finishes playing. Do not speak further.'
      },
    }),

    switch_language: llm.tool({
      description:
        'Switch the conversation language when the customer switches or asks. ' +
        'This ACTUALLY switches the STT and TTS audio pipelines. Call ONCE per switch.',
      parameters: z.object({
        language: z.enum(['hindi', 'english', 'marathi', 'hinglish', 'marathienglish']),
      }),
      execute: async (args) => {
        const config = LANGUAGE_CONFIG[args.language] || LANGUAGE_CONFIG.hinglish!
        deps.stt.setLanguage(config.code)
        deps.tts.setLanguage(config.code)
        console.log(`[voice-agent] language switched to ${config.display} for ${deps.customerPhone}`)
        return (
          `Audio pipeline switched to ${config.display}. Continue the conversation entirely in ${config.display} ` +
          'with the same warm tone. Do not announce the switch unless the customer asked.'
        )
      },
    }),
  }
}
