export interface MemoryVisit {
  sessionId: string;
  path: string;
  userEmail?: string;
  timestamp: number;
}

// In-memory ring buffer ensuring realtime stats work even if Supabase table is pending
const globalWithVisits = global as typeof globalThis & {
  _oddora_inMemoryVisits?: MemoryVisit[];
};

if (!globalWithVisits._oddora_inMemoryVisits) {
  globalWithVisits._oddora_inMemoryVisits = [];
}

export const inMemoryVisits: MemoryVisit[] = globalWithVisits._oddora_inMemoryVisits;

export function recordMemoryVisit(visit: MemoryVisit) {
  inMemoryVisits.push(visit);
  if (inMemoryVisits.length > 5000) {
    inMemoryVisits.splice(0, inMemoryVisits.length - 5000);
  }
}
