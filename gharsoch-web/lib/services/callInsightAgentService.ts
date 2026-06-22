import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { openaiChatCompletion } from '@/lib/openaiClient'
import { actionItemService } from '@/lib/services/actionItemService'
import { paymentService } from '@/lib/services/paymentService'

const SYSTEM_PROMPT = `You are the Call Insight Agent, an expert AI assistant that analyzes real estate sales call transcripts.
You must extract structured insights from the transcript and return ONLY valid JSON.
The JSON must adhere to the following schema:
{
  "sentiment": "positive|neutral|negative",
  "objections": [
    { "category": "budget|timing|competitor|trust|other", "detail": "string", "resolved": boolean }
  ],
  "action_items": [
    { "action_type": "site_visit|payment_followup|send_material|callback|escalation", "description": "string", "priority": "high|medium|low" }
  ],
  "payments_discussed": [
    { "amount": number, "status": "discussed|committed|partial|completed", "commitment_date": "YYYY-MM-DD or null" }
  ],
  "lead_status_recommendation": "hot|warm|cold",
  "summary": "Brief 2-3 sentence summary of the call."
}
Do not include markdown formatting blocks, just the raw JSON string.`

export const callInsightAgentService = {
  /**
   * Run post-call analysis using gpt-4o.
   * Modifies calls, leads, action_items, and payments idempotently.
   */
  async analyzeCall(callId: string): Promise<any> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')

    const call = await db.collection('calls').findOne({ _id: new ObjectId(callId) })
    if (!call) throw new Error(`Call ${callId} not found`)
    if (!call.transcript || call.transcript.trim() === '') {
      throw new Error(`Call ${callId} has no transcript to analyze`)
    }

    const leadId = call.lead_id
    const brokerId = call.broker_id

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Transcript:\n\n${call.transcript}` }
    ]

    const response = await openaiChatCompletion({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    })

    let analysis: any
    try {
      analysis = JSON.parse(response.content)
    } catch (e) {
      throw new Error('Failed to parse Call Insight Agent response as JSON')
    }

    // 1. Update Call Doc
    const objections = (analysis.objections || []).map((obj: any) => ({
      ...obj,
      logged_at: new Date(),
      source: 'call_insight',
    }))

    await db.collection('calls').updateOne(
      { _id: call._id },
      { 
        $set: { 
          analysis,
          analyzed_at: new Date(),
          call_summary: analysis.summary || call.call_summary,
          sentiment_label: analysis.sentiment || null,
          objections_logged: [
            ...(call.objections_logged || []),
            ...objections,
          ],
          updated_at: new Date(),
        },
      }
    )

    // 2. Update Lead Doc
    if (leadId) {
      let leadUpdate: any = { updated_at: new Date() }
      if (['hot', 'warm', 'cold'].includes(analysis.lead_status_recommendation)) {
        leadUpdate.status = analysis.lead_status_recommendation
      }
      
      const lead = await db.collection('leads').findOne({ _id: new ObjectId(leadId) })
      if (lead) {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        const insightNote = `[${timestamp}] Call Insight Summary: ${analysis.summary}`
        leadUpdate.notes = lead.notes ? `${lead.notes}\n${insightNote}` : insightNote
        
        await db.collection('leads').updateOne(
          { _id: new ObjectId(leadId) },
          { $set: leadUpdate }
        )
      }
    }

    // 3. Create Action Items (Idempotent via source_idempotency_key)
    if (leadId && brokerId && analysis.action_items && Array.isArray(analysis.action_items)) {
      for (let i = 0; i < analysis.action_items.length; i++) {
        const item = analysis.action_items[i]
        const ik = `${call._id}:call_insight_action:${i}`
        
        // Manual idempotency check
        const existingItem = await db.collection('action_items').findOne({ source_idempotency_key: ik })
        if (!existingItem) {
          await actionItemService.create({
            broker_id: String(brokerId),
            lead_id: String(leadId),
            action_type: item.action_type || 'callback',
            description: item.description,
            priority: item.priority || 'medium',
            source: 'call_insight',
            call_id: String(call._id),
            source_idempotency_key: ik
          })
        }
      }
    }

    // 4. Create Payments
    if (leadId && brokerId && analysis.payments_discussed && Array.isArray(analysis.payments_discussed)) {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
      for (const p of analysis.payments_discussed) {
        // Idempotency: avoid duplicating exact same amount/status for this lead in last 15 mins
        const existingPayment = await db.collection('payments').findOne({
          lead_id: String(leadId),
          amount_discussed: Number(p.amount) || 0,
          payment_status: p.status,
          created_at: { $gte: fifteenMinAgo }
        })

        if (!existingPayment) {
          await paymentService.create({
            broker_id: String(brokerId),
            lead_id: String(leadId),
            amount_discussed: Number(p.amount) || 0,
            payment_status: p.status || 'discussed',
            commitment_date: p.commitment_date || null,
            call_id: String(call._id),
            follow_up_notes: 'Extracted from Call Insight Analysis'
          })
        }
      }
    }

    return analysis
  }
}
