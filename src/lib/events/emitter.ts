import EventEmitter from 'events';

// ==========================================
// ENTERPRISE EVENT ENGINE
// Drives all cross-module business automation and workflow rules.
// ==========================================

class CRMEmitter extends EventEmitter {}

export const crmEvents = new CRMEmitter();

// Define strong types for Event Names
export type CRMEventName = 
  | 'lead.created'
  | 'lead.qualified'
  | 'deal.created'
  | 'deal.won'
  | 'deal.lost'
  | 'candidate.applied'
  | 'candidate.hired'
  | 'invoice.created'
  | 'invoice.paid'
  | 'employee.onboarded';

// Global Event Registrar
export const emitCrmEvent = (event: CRMEventName, payload: any) => {
  console.log(`[CRM Event Engine] Emitting: ${event}`);
  crmEvents.emit(event, payload);
};

export const onCrmEvent = (event: CRMEventName, listener: (payload: any) => void) => {
  crmEvents.on(event, listener);
};

// ==========================================
// BUSINESS AUTOMATION SUBSCRIPTIONS (PHASE 2)
// This initializes the listeners that react to the events.
// ==========================================

onCrmEvent('deal.won', async (payload) => {
  console.log(`[Automation] Processing deal.won for deal: ${payload.dealId}`);
  // In production, this can trigger BullMQ jobs, WebHooks, or direct DB calls
  // The actual DB logic is currently embedded in the deals.service.ts
  // Over time, those embedded cross-module calls will move here to fully decouple services.
});

onCrmEvent('candidate.hired', async (payload) => {
  console.log(`[Automation] Processing candidate.hired for candidate: ${payload.candidateId}`);
});
