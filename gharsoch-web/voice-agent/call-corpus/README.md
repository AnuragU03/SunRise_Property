# Call Corpus — real broker calls (Ajit / ground truth)

Real recorded calls by the human broker, transcribed. **This corpus is the
authoritative source for prompt design** — the agent should sound and SELL like
these calls, not like an invented script. Cite these files when changing
`voice-agent/prompt.ts`.

| File | Type | Language | What it teaches |
|---|---|---|---|
| `01-reengage-2bhk-harshad.md` | reengage | Hinglish | Memory anchor, concrete inventory pitch, seller-urgency leverage, budget bridge, weekend negotiation, WhatsApp confirm |
| `02-followup-vidya.md` | follow_up | Marathi | Handling "send details first" deflection without losing the visit thread |
| `03-reengage-3bhk-rahul.md` | reengage | Hinglish/English | Objection reframe with facts, product fluency, transparent negotiation bands, 4BHK upsell, next-day visit logistics |
| `04-reengage-1bhk-vidya.md` | reengage | Marathi/Hindi | Discovering the REAL objection (vastu) and pitching the unit that answers it |
| `05-inbound-rental-marathi.md` | inbound + rental | Marathi | Inbound qualification, comparative selling (maintenance/amenities), honesty, commute-based advice, friction-free visit close |

## The playbook (cross-cutting moves every call shows)

1. **Memory-anchored opener** — when they visited, what they saw, their exact spec
   (config + carpet + budget + WHY this area, e.g. "relatives nearby").
2. **Concrete pitch** — carpet sqft, floor, facing, ask price, realistic close band,
   maintenance. Never vague "great new options".
3. **Urgency as leverage** — "sellers are pressed, you'll benefit in negotiation".
4. **Requirement refresh** — "are you still looking, or have you refined?"
5. **Budget bridge** — never reject a budget; "they ask 195, I think we can bring it
   close to your 170".
6. **Objection → matched solution** — vastu objection → pitch the NE-facing unit;
   "crowded" → reframe with cluster facts. Objections from past calls feed the NEXT call.
7. **Transparent negotiation** — ask vs close vs "I'll push 4-5L below closing".
8. **Honesty builds trust** — admit the missing balcony, correct your own numbers,
   "you'll only get clarity by seeing it physically".
9. **Visit-first close, calendar craft** — probe alternatives ("Saturday not at all?"),
   invite the family, reduce friction ("one visit, one hour, keys with me, office across").
10. **WhatsApp inside the call** — photos + details + WRITTEN meeting confirmation
    ("I'll confirm on WhatsApp that we're meeting Sunday the 12th").
11. **Language follows the customer** — Hinglish/Marathi per lead, natural mixing.
12. **Colleague can join mid-call** (Speaker 3) — live takeover is a real workflow.

## Variables the agent needs per call (extracted from these calls)

Lead/requirement: `last_visit_date_human`, `days_since_visit`, `last_visit_property`,
`requirement_config` (2BHK…), `min_carpet_sqft`, `budget_range`, `facing_pref` /
`vastu_required`, `area_reason`, `purpose` (buy|rent), `rent_budget`, `objection_history`.

Property (per pitched option): `title`, `carpet_area_sqft`, `floor`, `facing`,
`ask_price`, `close_price_band`, `maintenance_monthly`, `furnishing`, `balconies`,
`seller_urgency`, cluster/амenity facts.

Broker: availability slots, office location ("office right across"), keys-on-hand.
