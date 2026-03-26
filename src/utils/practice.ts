import type { AnswerPayload, MCQQuestion, PracticeFeedback } from "../types";

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function buildPracticeFeedback(
  questions: MCQQuestion[],
  answers: AnswerPayload[],
  totalTime: number
): PracticeFeedback {
  const total = questions.length;
  const correct = answers.filter((answer) => answer.selected === answer.correct).length;
  const wrong = answers.filter((answer) => answer.selected && answer.selected !== answer.correct).length;
  const skipped = answers.filter((answer) => !answer.selected).length;
  const accuracy = total ? correct / total : 0;
  const avgTimePerQ = total ? totalTime / total : 0;
  const topic = answers[0]?.subtopic || "Mixed Practice";

  let speedLabel = "Balanced";
  if (avgTimePerQ > 45) speedLabel = "Deliberate";
  if (avgTimePerQ < 20) speedLabel = "Fast";

  let recommendation = "Run another practice set on the same topic and review every explanation.";
  if (accuracy >= 0.8) {
    recommendation = "Move one difficulty higher or switch to timed mode to build placement-test pressure handling.";
  } else if (accuracy >= 0.55) {
    recommendation = "Stay on the same difficulty and repeat this topic in timed mode once your explanations feel clear.";
  } else if (speedLabel === "Fast") {
    recommendation = "You are moving too quickly for this topic. Slow down and focus on solving logic before speed.";
  }

  return {
    score: correct,
    total,
    accuracy,
    correct,
    wrong,
    skipped,
    avgTimePerQ,
    strongestTopic: topic,
    weakestTopic: topic,
    speedLabel,
    recommendation,
  };
}
