export type RequirementResult = {
  requirement: string;
  status: 'matched' | 'unclear' | 'missing';
  evidence: string;
};

export type MatchResult = {
  candidate_name: string;
  score: number;
  requirements?: RequirementResult[];
  matched?: string[];
  unclear?: string[];
  missing?: string[];
  summary: string;
  jd_format_warning?: string;
};

export type ScoredCV = {
  filename: string;
  result: MatchResult | null;
  error?: string;
};

export type FileWithStatus = {
  file: File;
  status: 'pending' | 'parsed' | 'failed';
  error?: string;
};
