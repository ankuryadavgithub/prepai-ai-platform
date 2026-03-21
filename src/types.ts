export const TOPICS = {
  numerical: [
    "Percentage", "Number System", "Arithmetic", "Data Interpretation",
    "Geometry & Mensuration", "Profit & Loss", "Ratio & Proportion",
    "Time & Work", "Simplification", "Speed, Time & Distance",
    "LCM & HCF", "Linear Equation", "Mixture & Alligation",
    "Permutation & Combination", "Simple & Compound Interest",
    "Average", "Divisibility Rules", "Partnership", "Probability",
    "Age Problems", "Train Problems"
  ],
  logical: [
    "Logical Deduction", "Letter & Number Series", "Data Sufficiency",
    "Pattern Recognition", "Syllogism", "Blood Relation",
    "Data Arrangement", "Visual Reasoning", "Spatial Reasoning",
    "Attention to Detail", "Venn Diagrams", "Calendar",
    "Coding-Decoding", "Directions", "Seating Arrangement"
  ],
  verbal: [
    "Reading Comprehension", "Cloze Test", "Error Spotting",
    "Sentence Completion", "Synonyms & Antonyms", "Vocabulary",
    "Para Jumbles", "Grammar", "Tense",
    "Articles, Prepositions, Conjunctions", "Subject-Verb Agreement"
  ]
};

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface MCQQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface CodingProblem {
  problem: string;
  input: string;
  output: string;
  constraints: string;
  solution: string;
}

export interface InterviewResponse {
  question: string;
  feedback?: string;
  score?: string;
}
