export type CvSeverity = 'critical' | 'warn' | 'info';
export type CvCategory = 'ats' | 'structure' | 'impact' | 'consistency' | 'keywords';
export type CvRole = 'senior_frontend_angular' | 'senior_frontend_react' | 'senior_frontend_general';
export type CvExtractionStatus = 'ok' | 'low_text' | 'failed' | 'text_input';

export interface CvIssue {
  id: string;
  severity: CvSeverity;
  category: CvCategory;
  scoreDelta: number;
  title: string;
  message: string;
  explanation: string;
  why: string;
  fix: string;
  evidence?: CvIssueEvidence[];
}

export interface CvIssueEvidence {
  excerpt?: string;
  line?: number;
  details?: string;
  source?: 'pdf' | 'docx' | 'raw_text';
  confidence?: number;
  // Legacy fields kept for backward compatibility with existing payloads.
  snippet?: string;
  lineStart?: number;
  lineEnd?: number;
  reason?: string;
}

export interface CvCategoryScore {
  id: CvCategory;
  label: string;
  score: number;
  max: number;
}

export interface CvScores {
  overall: number;
  ats: number;
  structure: number;
  impact: number;
  consistency: number;
  keywords: number;
}

export interface CvKeywordCoverage {
  role: CvRole;
  roleLabel: string;
  total: number;
  found: string[];
  missing: string[];
  missingCritical: string[];
  skillsOnly: string[];
  foundInExperienceCount: number;
  coveragePct: number;
}

export interface CvAnalyzeMeta {
  source: 'file' | 'text';
  extractionStatus: CvExtractionStatus;
  textLength: number;
  fallbackRecommended: boolean;
  role: CvRole;
  timingsMs: {
    validation: number;
    extraction: number;
    scoring: number;
    total: number;
  };
}

export interface CvAnalyzeResponse {
  scores: CvScores;
  breakdown: CvCategoryScore[];
  issues: CvIssue[];
  keywordCoverage: CvKeywordCoverage;
  textPreview?: string;
  meta: CvAnalyzeMeta;
  debug?: {
    extractionQuality?: {
      score: number;
      level: 'high' | 'medium' | 'low';
    };
    missingKeywords?: {
      critical?: string[];
      strong?: string[];
      nice?: string[];
    };
  };
}
