export type CompanyPlanAnswerLevel = 'junior' | 'mid' | 'senior' | 'staff';
/** The framework a person chose for the tasks, when it is not the one the company's reports name. */
export type CompanyPlanFrameworkChoice = 'react' | 'angular' | 'vue' | 'javascript';
export type CompanyPlanWhen = 'tomorrow' | 'this-week' | 'next-week' | 'few-weeks' | 'later';

/** The form answers. A plan is rebuilt from these and the current content, so no task list is ever stored. */
export type CompanyPlanAnswers = {
  readonly companies: readonly { readonly slug: string; readonly list?: string }[];
  readonly level: CompanyPlanAnswerLevel;
  readonly when: CompanyPlanWhen;
  /**
   * The rounds already behind the person, as keys from companyPlanRoundKey, from the form's "Which round is next?".
   * Absent when nothing was stated, so an account keeps the rounds it marked by hand.
   */
  readonly passedRounds?: readonly string[];
  /** The framework the tasks follow, when the person chose one instead of the framework in the reports. */
  readonly framework?: CompanyPlanFrameworkChoice;
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
