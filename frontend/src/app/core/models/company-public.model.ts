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

export type CompanyIndexResolved = { companies: CompanyCard[] };

export type CompanyPreviewResolved = {
  slug: string;
  mode: 'editorial' | 'catalog';
  counts: CompanyCountBucket;
  samples: CompanyPreviewQuestion[];
};
