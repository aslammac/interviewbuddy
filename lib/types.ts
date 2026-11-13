export type Skill = {
  id: string;
  name: string;
  description: string;
  color: string;
  sort_order: number;
};
export type Question = {
  id: string;
  skill_id: string;
  title: string;
  answer: string;
  explanation: string;
  example: string;
  difficulty: string;
  status: string;
};
export type Progress = {
  question_id: string;
  bookmarked: boolean;
  confidence: string;
  notes: string;
};
export type Interview = {
  id: string;
  company: string;
  role_title: string;
  status: string;
  round_name: string;
  scheduled_at: string | null;
  notes: string;
};
export type AskedQuestion = {
  id: string;
  interview_id: string;
  skill_id: string;
  difficulty: string;
  title: string;
  answer: string;
  round_name: string;
};
export type Prompt = {
  id: string;
  title: string;
  category: string;
  template: string;
  visibility: string;
};
export const statuses = [
  "Applied",
  "Screening",
  "Interviewing",
  "Offer",
  "Accepted",
  "Rejected",
  "Withdrawn",
];
export const difficulties = ["Beginner", "Intermediate", "Advanced"];
