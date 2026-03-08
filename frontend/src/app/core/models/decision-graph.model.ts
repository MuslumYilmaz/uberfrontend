export type DecisionGraphLanguage = 'javascript' | 'typescript';

export type DecisionGraphBranch = 'why' | 'alternative' | 'tradeoff';

export type DecisionGraphAnchor = {
  lineStart: number;
  lineEnd?: number;
  snippet?: string;
  label?: string;
};

export type DecisionGraphNode = {
  id: string;
  title: string;
  anchor: DecisionGraphAnchor;
  why: string;
  alternative: string;
  tradeoff: string;
};

export type DecisionGraphDocument = {
  questionId: string;
  version: number;
  key?: string;
  language?: DecisionGraphLanguage;
  code: string;
  nodes: DecisionGraphNode[];
};
