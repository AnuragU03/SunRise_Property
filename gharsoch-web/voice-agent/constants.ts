/**
 * constants.ts — port of the Python worker's app/config/constants.py.
 * Broker identity is NOT hardcoded here (unlike the Python original) — it comes
 * from room metadata / env at call time. Only behavioural constants live here.
 */

export const DEFAULT_LANGUAGE = 'hi-IN'
export const DEFAULT_TTS_SPEAKER = process.env.SARVAM_TTS_SPEAKER || 'ritu'

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'hi-IN': 'Hindi',
  'en-IN': 'English (India)',
  'mr-IN': 'Marathi',
  'hi-EN': 'Hinglish (Hindi-English mix)',
  unknown: 'Auto-detect',
}

/**
 * Spoken greeting text per language (NOT an LLM instruction). Used with
 * session.say() so the first turn is deterministic — the LLM is not invoked for
 * the greeting, which prevents weak models from running tools / wrapping up the
 * call before the customer has even spoken.
 */
export const GREETING_TEXTS: Record<string, string> = {
  'hi-IN': 'हैलो {customer_name} जी! मैं {broker_name} बोल रहा हूँ, {agency_name} से। कैसे हैं आप?',
  'mr-IN': 'हॅलो {customer_name} जी! मी {broker_name} बोलतोय, {agency_name} कडून. कसे आहात तुम्ही?',
  'en-IN': 'Hello {customer_name}! This is {broker_name} from {agency_name}. How are you doing?',
  'hi-EN': 'हैलो {customer_name} जी! मैं {broker_name} बोल रहा हूँ, {agency_name} से। कैसे हैं आप?',
}

/**
 * Inbound answering greetings — WE are picking up THEIR call, so the shape flips:
 * identify the agency first, then ask how to help (corpus call 05: the broker
 * answers, then qualifies what the caller saw/wants). Known leads get the
 * by-name variant so the relationship carries into the first sentence.
 */
export const INBOUND_GREETING_TEXTS: Record<string, string> = {
  'hi-IN': 'नमस्ते, {agency_name} में आपका स्वागत है! मैं {broker_name} बोल रहा हूँ। बताइए, मैं आपकी कैसे मदद कर सकता हूँ?',
  'mr-IN': 'नमस्कार, {agency_name} मध्ये आपले स्वागत आहे! मी {broker_name} बोलतोय. बोला, मी तुमची कशी मदत करू शकतो?',
  'en-IN': 'Hello, thank you for calling {agency_name}! This is {broker_name}. How may I help you today?',
  'hi-EN': 'नमस्ते, {agency_name} में आपका स्वागत है! मैं {broker_name} बोल रहा हूँ। बताइए, कैसे मदद कर सकता हूँ?',
}

export const INBOUND_GREETING_KNOWN_TEXTS: Record<string, string> = {
  'hi-IN': 'नमस्ते {customer_name} जी, {agency_name} से {broker_name} बोल रहा हूँ। अच्छा लगा आपने कॉल किया! बताइए, कैसे मदद कर सकता हूँ?',
  'mr-IN': 'नमस्कार {customer_name} जी, {agency_name} कडून {broker_name} बोलतोय. छान वाटलं तुम्ही कॉल केला! बोला, कशी मदत करू?',
  'en-IN': 'Hello {customer_name}, this is {broker_name} from {agency_name}. Good to hear from you! How can I help?',
  'hi-EN': 'नमस्ते {customer_name} जी, {agency_name} से {broker_name} बोल रहा हूँ। बताइए, कैसे मदद कर सकता हूँ?',
}

/** Greeting instruction per language. {customer_name}/{broker_name}/{agency_name} filled at runtime. */
export const GREETINGS: Record<string, string> = {
  'hi-IN':
    "Say exactly this greeting in Devanagari Hindi: 'हैलो {customer_name} जी! मैं {broker_name} बोल रहा हूँ, {agency_name} से। कैसे हैं आप?' — say only this one sentence, nothing more.",
  'mr-IN':
    "Say exactly this greeting in Devanagari Marathi: 'हॅलो {customer_name} जी! मी {broker_name} बोलतोय, {agency_name} कडून. कसे आहात तुम्ही?' — say only this one sentence, nothing more.",
  'en-IN':
    "Say exactly this greeting in English: 'Hello {customer_name}! This is {broker_name} from {agency_name}. How are you doing?' — say only this one sentence, nothing more.",
  'hi-EN':
    "Say exactly this greeting in Devanagari Hindi: 'हैलो {customer_name} जी! मैं {broker_name} बोल रहा हूँ, {agency_name} से। कैसे हैं आप?' — say only this one sentence, nothing more.",
}

/** Short prompt when the customer goes silent. */
export const SILENCE_PROMPTS: Record<string, string> = {
  'hi-IN': "The customer has gone silent. Say ONE short line: 'हैलो जी, सुन रहे हैं आप?'",
  'mr-IN': "The customer has gone silent. Say ONE short Marathi line: 'हॅलो जी, ऐकताय का तुम्ही?'",
  'en-IN': "The customer has gone silent. Say ONE short line: 'Hello, are you still there?'",
  'hi-EN': "The customer has gone silent. Say ONE short Hinglish line: 'हैलो जी, सुन रहे हैं आप?'",
}

/** Wrap-up line when max call duration is hit. */
export const WRAPUP_PROMPTS: Record<string, string> = {
  'hi-IN': "Politely wrap up in ONE line: 'जी, मैं आपको WhatsApp पे details भेज देता हूँ। धन्यवाद!' Then stop.",
  'mr-IN': "Politely wrap up in ONE Marathi line: 'जी, मी तुम्हाला WhatsApp वर details पाठवतो. धन्यवाद!' Then stop.",
  'en-IN': "Politely wrap up in ONE line: 'I'll send you the details on WhatsApp. Thank you!' Then stop.",
  'hi-EN': "Politely wrap up in ONE line: 'जी, main aapko WhatsApp pe details bhej deta hoon. धन्यवाद!' Then stop.",
}

/**
 * Step 1 of the closing ritual — ask if they need anything else.
 * The LLM says this aloud, waits for response, then proceeds to Step 2.
 */
export const CLOSING_CHECKIN_TEXTS: Record<string, string> = {
  'hi-IN': 'और कोई सवाल था जी? कुछ और पूछना था?',
  'mr-IN': 'आणखी काही विचारायचं होतं का जी?',
  'en-IN': 'Is there anything else I can help you with before we wrap up?',
  'hi-EN': 'और कोई सवाल था जी? कुछ और पूछना था?',
}

/**
 * Step 3 of the closing ritual — final goodbye line before calling tools.
 * Keep to ONE sentence. Spoken by the agent right before save_conversation_summary → log_call_outcome → end_call.
 */
export const GOODBYE_TEXTS: Record<string, string> = {
  'hi-IN': 'धन्यवाद जी! Take care, अच्छे से रहिए।',
  'mr-IN': 'धन्यवाद जी! काळजी घ्या.',
  'en-IN': 'Thank you so much! Have a wonderful day. Take care!',
  'hi-EN': 'धन्यवाद जी! Take care, अच्छे से रहिए।',
}

/**
 * Step 2 outcome-specific closing remarks — sent as an LLM instruction so the
 * model says the right thing based on what was achieved this call.
 */
export const CLOSING_REMARKS: Record<string, Record<string, string>> = {
  appointment_booked: {
    'hi-IN': 'बढ़िया जी! मैं WhatsApp पे appointment details और property की photos भेज देता हूँ।',
    'mr-IN': 'छान जी! WhatsApp वर appointment details आणि photos पाठवतो.',
    'en-IN': 'Great! I\'ll send the appointment details and property photos on WhatsApp right away.',
    'hi-EN': 'बढ़िया जी! WhatsApp पे appointment details भेज देता हूँ।',
  },
  callback_requested: {
    'hi-IN': 'ठीक है जी, उस time पे call करता हूँ। तब तक कुछ mind में आए तो WhatsApp कर दीजिए।',
    'mr-IN': 'ठीक आहे जी, त्या वेळी call करतो. तोपर्यंत काही असेल तर WhatsApp करा.',
    'en-IN': 'No problem! I\'ll call you back at the scheduled time. Feel free to WhatsApp me in the meantime.',
    'hi-EN': 'ठीक है जी, उस time पे call करता हूँ। WhatsApp भी कर सकते हैं।',
  },
  not_interested_now: {
    'hi-IN': 'कोई बात नहीं जी। Future में कभी भी कुछ चाहिए हो तो बेझिझक call कीजिए।',
    'mr-IN': 'काही हरकत नाही जी. भविष्यात काही लागलं तर नक्की call करा.',
    'en-IN': 'No worries at all! If you ever need anything in the future, feel free to reach out anytime.',
    'hi-EN': 'कोई बात नहीं जी। कभी भी जरूरत हो तो call कीजिए।',
  },
  customer_busy_reschedule: {
    'hi-IN': 'बिल्कुल जी, आपकी convenience पर बात करेंगे। उस time पे call करता हूँ।',
    'mr-IN': 'नक्कीच जी, तुमच्या वेळेनुसार बोलू. त्या वेळी call करतो.',
    'en-IN': 'Absolutely! We\'ll connect at a better time. I\'ll call you then.',
    'hi-EN': 'बिल्कुल जी, उस time पे call करता हूँ।',
  },
  existing_customer: {
    'hi-IN': 'अच्छा जी! अगर कोई नई requirement हो या कुछ update चाहिए तो call कीजिए।',
    'mr-IN': 'ठीक आहे जी! नवीन requirement असेल तर call करा.',
    'en-IN': 'Of course! If there\'s anything new you need, don\'t hesitate to call.',
    'hi-EN': 'अच्छा जी! कोई नई requirement हो तो call कीजिए।',
  },
  default: {
    'hi-IN': 'ठीक है जी! कोई भी सवाल हो तो call या WhatsApp कर सकते हैं।',
    'mr-IN': 'ठीक आहे जी! काही प्रश्न असेल तर call किंवा WhatsApp करा.',
    'en-IN': 'Alright! Feel free to call or WhatsApp if you have any questions.',
    'hi-EN': 'ठीक है जी! कोई सवाल हो तो call या WhatsApp कीजिए।',
  },
}

export const VALID_OUTCOMES = [
  'appointment_booked',
  'callback_requested',
  'not_interested_now',
  'dnc_requested',
  'customer_busy_reschedule',
  'wrong_number',
  'existing_customer',
] as const

// ─── Timing ────────────────────────────────────────────────────────────────
export const MAX_CALL_DURATION_SECONDS = 300 // 5 min hard cap
export const CONVERSATION_INACTIVITY_TIMEOUT_SECONDS = 90
export const INACTIVITY_WATCHDOG_INTERVAL_SECONDS = 5
export const USER_AWAY_TIMEOUT_SECONDS = 20

// ─── Goodbye detection (deterministic auto-end) ────────────────────────────
// CRITICAL: only UNAMBIGUOUS sign-offs. Politeness/greeting words (धन्यवाद /
// thank you / शुक्रिया / namaste / namaskar) are said NORMALLY mid-call — an
// Indian broker thanks the customer constantly and opens with namaste — so
// matching them falsely ends live calls (and would instantly kill inbound calls,
// whose greeting IS "नमस्ते"). Real closings come from the LLM's end_call tool;
// this list is just a backstop for clear "I'm hanging up now" phrases.
export const AGENT_GOODBYE_PHRASES = [
  'alvida', 'अलविदा',
  'take care', 'have a good day', 'have a nice day', 'have a great day',
  'thank you for your time', 'thanks for your time',
  'goodbye', 'good bye', 'bye bye', 'bye-bye',
  'निरोप', 'येतो',
]

// Only UNAMBIGUOUS goodbyes — words like "ठीक"/"accha"/"okay"/"nahi" are normal
// mid-conversation acknowledgements ("मैं ठीक हूं" = "I'm fine"), so matching them
// would hang up live calls. The LLM's own end_call handles real closings; this is
// just a deterministic backstop for clear sign-offs.
export const CUSTOMER_GOODBYE_PHRASES = [
  'bye', 'good bye', 'goodbye', 'bye bye', 'okay bye', 'ok bye',
  'theek hai bye', 'alvida', 'अलविदा',
  'thank you bye', 'bye thank you',
]

/** Only rooms with these prefixes are handled — protects unrelated rooms in a shared LiveKit project. */
export const MANAGED_ROOM_PREFIXES = ['call-', 'web-']
