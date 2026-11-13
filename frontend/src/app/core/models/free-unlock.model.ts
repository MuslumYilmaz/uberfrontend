/**
 * The one reported question a free account opened on a company guide (backend/models/User.js `freeUnlock`): its row,
 * and the Premium practice task behind it (`practiceId`), read as open. One per account across all guides.
 */
export type FreeUnlock = {
  readonly company: string;
  readonly questionId: string;
  readonly practiceId: string | null;
  readonly unlockedAt: string;
};
