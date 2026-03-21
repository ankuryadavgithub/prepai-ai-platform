export const generateMCQ = async (
  category: string,
  topic: string,
  difficulty: string,
  retry = 0 // 🔥 prevent infinite loop
) => {
  const prompt = `
You are an expert aptitude trainer.

Generate EXACTLY 10 ${difficulty} MCQs.

STRICT CONDITIONS:
- Category: ${category}
- Topic: ${topic}
- ONLY ${topic} questions
- NO other topics
- Placement level (TCS / Infosys)

IMPORTANT:
- Return ONLY JSON ARRAY
- No markdown
- No \`\`\`
- No explanation outside JSON

Format:
[
  {
    "question": "",
    "options": ["", "", "", ""],
    "correct_answer": "",
    "explanation": ""
  }
]
`;

  try {
    const response = await (window as any).puter.ai.chat(prompt, {
      model: "gemini-3-flash-preview"
    });

    let text =
      typeof response === "string"
        ? response
        : response?.message?.content || "";

    // 🔥 CLEAN MARKDOWN
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // 🔥 EXTRACT ARRAY SAFELY
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start === -1 || end === -1) {
      throw new Error("No JSON array found");
    }

    text = text.substring(start, end + 1);

    let data = JSON.parse(text);

    // 🔥 ENSURE ARRAY
    if (!Array.isArray(data)) {
      data = [data];
    }

    // 🔥 BASIC VALIDATION
    const valid = data.filter(
      (q: any) =>
        q?.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.correct_answer &&
        q.explanation
    );

    // 🔥 TOPIC VALIDATION (IMPORTANT FIX)
    const keywords = topicKeywords[topic] || [];

    const strictValid = valid.filter((q: any) =>
      keywords.some((k: string) =>
        q.question.toLowerCase().includes(k.toLowerCase())
      )
    );

    // 🔥 FINAL LOGIC
    if (strictValid.length >= 7) {
      return strictValid.slice(0, 10);
    }

    if (valid.length >= 7) {
      return valid.slice(0, 10);
    }

    // 🔁 SAFE RETRY (MAX 2 TIMES)
    if (retry < 2) {
      console.log("Retrying MCQ generation...");
      return await generateMCQ(category, topic, difficulty, retry + 1);
    }

    return valid.slice(0, 10);

  } catch (err) {
    console.log("MCQ ERROR:", err);
    return [];
  }
};



// 🔥 COMPLETE KEYWORDS MAP
const topicKeywords: any = {
  // NUMERICAL
  "Percentage": ["%", "percent", "increase", "decrease"],
  "Number System": ["divisible", "remainder", "integer"],
  "Arithmetic": ["sum", "difference"],
  "Data Interpretation": ["table", "chart", "graph"],
  "Geometry & Mensuration": ["area", "volume", "perimeter"],
  "Profit & Loss": ["profit", "loss", "selling"],
  "Ratio & Proportion": ["ratio", "proportion"],
  "Time & Work": ["work", "days", "efficiency"],
  "Simplification": ["simplify", "expression"],
  "Speed, Time & Distance": ["speed", "distance"],
  "LCM & HCF": ["lcm", "hcf"],
  "Linear Equation": ["equation", "solve"],
  "Mixture & Alligation": ["mixture"],
  "Permutation & Combination": ["permutation", "combination"],
  "Simple & Compound Interest": ["interest"],
  "Average": ["average"],
  "Divisibility Rules": ["divisible"],
  "Partnership": ["investment"],
  "Probability": ["probability"],
  "Age Problems": ["age"],
  "Train Problems": ["train"],

  // LOGICAL
  "Logical Deduction": ["conclusion", "assumption"],
  "Letter & Number Series": ["series", "missing"],
  "Data Sufficiency": ["statement"],
  "Pattern Recognition": ["pattern"],
  "Syllogism": ["all", "some"],
  "Blood Relation": ["father", "mother"],
  "Data Arrangement": ["arrange"],
  "Visual Reasoning": ["figure"],
  "Spatial Reasoning": ["direction"],
  "Attention to Detail": ["match"],
  "Venn Diagrams": ["venn"],
  "Calendar": ["day", "date"],
  "Coding-Decoding": ["code"],
  "Directions": ["north", "south"],
  "Seating Arrangement": ["sitting"],

  // VERBAL
  "Reading Comprehension": ["passage"],
  "Cloze Test": ["blank"],
  "Error Spotting": ["error"],
  "Sentence Completion": ["complete"],
  "Synonyms & Antonyms": ["similar", "opposite"],
  "Vocabulary": ["meaning"],
  "Para Jumbles": ["arrange"],
  "Grammar": ["grammar"],
  "Tense": ["past", "present"],
  "Articles, Prepositions, Conjunctions": ["a", "an", "the"],
  "Subject-Verb Agreement": ["verb"]
};



// 🔥 CODING (FIXED SAFE PARSER)
export const generateCodingProblem = async (difficulty: string) => {
  try {
    const response = await (window as any).puter.ai.chat(
      `Generate ONE ${difficulty} coding problem.

Return ONLY JSON:
{
  "problem": "",
  "input": "",
  "output": "",
  "constraints": "",
  "solution": ""
}`,
      { model: "gemini-3-flash-preview" }
    );

    let text =
      typeof response === "string"
        ? response
        : response?.message?.content || "";

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // 🔥 EXTRACT JSON OBJECT SAFELY
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("Invalid coding JSON");
    }

    text = text.substring(start, end + 1);

    return JSON.parse(text);

  } catch (err) {
    console.log("CODING ERROR:", err);
    return null;
  }
};