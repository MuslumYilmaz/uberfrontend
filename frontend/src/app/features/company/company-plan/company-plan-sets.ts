import { SHOWCASE_STATS } from '../../../generated/content-metadata';
import type { CompanySetCounts } from './company-plan.format';

/** Each company's practice set, counted as the company pages count it, so a plan promises what Premium shows. */
export const COMPANY_SET_COUNTS = SHOWCASE_STATS.companyCounts as Readonly<Record<string, CompanySetCounts | undefined>>;

/** Every Premium question in the library, the number pricing shows. */
export const PREMIUM_QUESTION_COUNT: number = SHOWCASE_STATS.premiumPracticeCount;
