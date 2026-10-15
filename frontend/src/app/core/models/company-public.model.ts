import { CompanyCountBucket } from '../../shared/company-counts.util';
import { AccessLevel, Difficulty } from './question.model';
import { Tech } from './user.model';

export type CompanyCard = { slug: string; label: string; count: number };

export type CompanyPreviewQuestion = {
  id: string;
  title: string;
  kind: 'coding' | 'trivia' | 'system-design';
  tech?: Tech;
  difficulty: Difficulty;
  access: AccessLevel;
};

export type CompanyReportSource = {
  label: string;
  url: string;
  publisher: string;
  date: string;
};

/** A catalog item that carries a public interview report scoped to one company (see gen-company-reports.mjs). */
export type CompanyReportedItem = {
  id: string;
  kind: 'coding' | 'debug' | 'system-design';
  tech?: Tech;
  title: string;
  access: AccessLevel;
  route: string;
  sources: CompanyReportSource[];
};

export type CompanyReportsPayload = {
  schemaVersion: number;
  companies: Record<string, CompanyReportedItem[]>;
};

export type CompanyIndexResolved = { companies: CompanyCard[] };

export type CompanyPreviewResolved = {
  slug: string;
  mode: 'editorial' | 'catalog';
  counts: CompanyCountBucket;
  samples: CompanyPreviewQuestion[];
  /** Items with public interview reports for this company; empty for authored pages. */
  reports?: CompanyReportedItem[];
};
