import type { PrismaClient } from '@prisma/client';

/** Minimal outbox stub — extend with a real `outbox` table when needed. */
export class EventOutbox {
  constructor(private readonly _prisma: PrismaClient) {
    void _prisma;
  }

  async publish(_events: unknown[]): Promise<void> {
    // Reserved for transactional outbox writes
  }

  async processOutbox(): Promise<void> {
    // Reserved for background dispatcher
  }
}
