import axios from "axios";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const callGroq = async (prompt: string) => {
  try {
    const res = await axios.post(
      GROQ_URL,
      {
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are an expert aptitude and coding question generator. ALWAYS return clean JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 2000
      },
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    const content = res?.data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    return content;

  } catch (err: any) {
    console.log("🔥 GROQ ERROR:", err.response?.data || err.message);
    throw err;
  }
};

// ================= MCQ =================
export const generateMCQ = async (
  category: string,
  topic: string,
  difficulty: string,
  retry = 0
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
    let text = await callGroq(prompt);

    // 🔥 CLEAN
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // 🔥 EXTRACT ARRAY
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start === -1 || end === -1) {
      throw new Error("No JSON array found");
    }

    text = text.substring(start, end + 1);

    let data = JSON.parse(text);

    if (!Array.isArray(data)) data = [data];

    // 🔥 VALIDATION
    const valid = data.filter(
      (q: any) =>
        q?.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.correct_answer &&
        q.explanation
    );

    // 🔥 TOPIC FILTER
    const keywords = topicKeywords[topic] || [];

    const strictValid = valid.filter((q: any) =>
      keywords.some((k: string) =>
        q.question.toLowerCase().includes(k.toLowerCase())
      )
    );

    // 🔥 FINAL LOGIC
    if (strictValid.length >= 7) return strictValid.slice(0, 10);
    if (valid.length >= 7) return valid.slice(0, 10);

    // 🔁 RETRY SAFE
    if (retry < 2) {
      console.log("Retrying MCQ...");
      return await generateMCQ(category, topic, difficulty, retry + 1);
    }

    return valid.slice(0, 10);

  } catch (err) {
    console.log("MCQ ERROR:", err);
    return [];
  }
};


// ================= KEYWORDS =================
const topicKeywords: any = {
  "Percentage": ["%", "percent", "increase", "decrease"],
  "Number System": ["divisible", "remainder", "integer"],
  "Arithmetic": ["sum", "difference"],
  "Data Interpretation": ["table", "chart", "graph"],
  "Geometry & Mensuration": ["area", "volume", "perimeter"],
  "Profit & Loss": ["profit", "loss"],
  "Ratio & Proportion": ["ratio"],
  "Time & Work": ["work", "days"],
  "Simplification": ["simplify"],
  "Speed, Time & Distance": ["speed", "distance"],
  "LCM & HCF": ["lcm", "hcf"],
  "Linear Equation": ["equation"],
  "Mixture & Alligation": ["mixture"],
  "Permutation & Combination": ["permutation"],
  "Simple & Compound Interest": ["interest"],
  "Average": ["average"],
  "Divisibility Rules": ["divisible"],
  "Partnership": ["investment"],
  "Probability": ["probability"],
  "Age Problems": ["age"],
  "Train Problems": ["train"],

  "Logical Deduction": ["conclusion"],
  "Letter & Number Series": ["series"],
  "Data Sufficiency": ["statement"],
  "Pattern Recognition": ["pattern"],
  "Syllogism": ["all", "some"],
  "Blood Relation": ["father"],
  "Data Arrangement": ["arrange"],
  "Visual Reasoning": ["figure"],
  "Spatial Reasoning": ["direction"],
  "Attention to Detail": ["match"],
  "Venn Diagrams": ["venn"],
  "Calendar": ["day"],
  "Coding-Decoding": ["code"],
  "Directions": ["north"],
  "Seating Arrangement": ["sitting"],

  "Reading Comprehension": ["passage"],
  "Cloze Test": ["blank"],
  "Error Spotting": ["error"],
  "Sentence Completion": ["complete"],
  "Synonyms & Antonyms": ["similar"],
  "Vocabulary": ["meaning"],
  "Para Jumbles": ["arrange"],
  "Grammar": ["grammar"],
  "Tense": ["past"],
  "Articles, Prepositions, Conjunctions": ["the"],
  "Subject-Verb Agreement": ["verb"]
};


// ================= CODING =================
export const generateCodingProblem = async (
  difficulty: string,
  retry = 0
) => {
  const prompt = `
Generate ONE ${difficulty} coding problem.

Return ONLY JSON:
{
  "problem": "",
  "input": "",
  "output": "",
  "constraints": "",
  "solution": ""
}
`;

  try {
    let text = await callGroq(prompt);

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("Invalid JSON");
    }

    const data = JSON.parse(text.substring(start, end + 1));

    if (!data.problem) throw new Error("Invalid structure");

    return data;

  } catch (err) {
    console.log("CODING ERROR:", err);

    if (retry < 2) {
      console.log("Retrying Coding Problem...");
      return await generateCodingProblem(difficulty, retry + 1);
    }

    return null;
  }
};