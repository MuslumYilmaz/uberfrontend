export type CompanyPlanAnswerLevel = 'junior' | 'mid' | 'senior' | 'staff';
export type CompanyPlanWhen = 'tomorrow' | 'this-week' | 'next-week' | 'later';

/** The form answers. A plan is rebuilt from these and the current content, so no task list is ever stored. */
export type CompanyPlanAnswers = {
  readonly companies: readonly { readonly slug: string; readonly list?: string }[];
  readonly level: CompanyPlanAnswerLevel;
  readonly when: CompanyPlanWhen;
};

/** The plan on an account, as PUT /api/users/me/company-plan and /api/auth/me return it. */
export type SavedCompanyPlan = CompanyPlanAnswers & {
  /** "Next week" is turned into a date from this. */
  readonly createdAt: string;
  /** Keys from companyPlanRoundKey. */
  readonly passedRounds: readonly string[];
  /** Tasks marked by hand, such as a guide. Separate from the solved list, so no XP or dashboard count moves. */
  readonly markedDone: readonly string[];
};
