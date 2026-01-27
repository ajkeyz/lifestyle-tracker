import OpenAI from "openai";
import { z } from "zod";
import type { Scenario } from "@shared/schema";
import { randomUUID } from "crypto";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = ["tech", "scam", "travel", "lifestyle", "investing", "debt"] as const;
type ScenarioCategory = typeof CATEGORIES[number];

const SYSTEM_PROMPT = `You are a financial literacy game designer. Generate realistic, engaging financial decision scenarios for a daily money game called "Lifestyle Creep".

Each scenario must:
1. Present a real-life financial decision people face
2. Have exactly 4 answer choices (A, B, C, D)
3. Have exactly ONE correct answer that represents sound financial wisdom
4. Include points: correct answer = 100, close-but-not-ideal = 40-60, poor choices = -20 to 10, terrible choices = -40 to -100
5. Have educational feedback for each choice explaining why it's good or bad
6. Include a "context" line showing the person's financial snapshot (Cash, Debt, Credit score, Stress level, and optionally other relevant info)

The scenarios should be:
- Relatable to young professionals and students
- Varied in complexity and topic
- Include common traps like lifestyle creep, FOMO spending, scams, and poor investment choices
- Teach practical financial wisdom without being preachy

Respond with valid JSON only, no markdown.`;

const ChoiceSchema = z.object({
  label: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  points: z.number(),
  feedback: z.string().min(1),
});

const DeepDiveSchema = z.object({
  teaching: z.string().min(1),
  alternative: z.string().nullable(),
  ruleOfThumb: z.string().min(1),
  realWorldExample: z.string().min(1),
});

const AIScenarioSchema = z.object({
  category: z.enum(CATEGORIES),
  context: z.string().min(1),
  question: z.string().min(1),
  choices: z.array(ChoiceSchema).length(4),
  deepDive: DeepDiveSchema.optional(),
});

const AIResponseSchema = z.object({
  scenarios: z.array(AIScenarioSchema).min(1),
});

function validateScenario(scenario: z.infer<typeof AIScenarioSchema>): boolean {
  const correctChoices = scenario.choices.filter(c => c.isCorrect);
  if (correctChoices.length !== 1) {
    console.warn("Scenario has invalid number of correct choices:", correctChoices.length);
    return false;
  }
  
  const labels = new Set(scenario.choices.map(c => c.label));
  if (labels.size !== 4) {
    console.warn("Scenario has duplicate or missing labels");
    return false;
  }
  
  return true;
}

export async function generateScenarios(count: number = 5): Promise<Scenario[]> {
  const selectedCategories: string[] = [];
  for (let i = 0; i < count; i++) {
    selectedCategories.push(CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]);
  }

  const userPrompt = `Generate exactly ${count} financial decision scenarios for categories: ${selectedCategories.join(", ")}.

IMPORTANT: You must generate exactly ${count} scenarios. Each scenario must have exactly 4 choices (A, B, C, D) with exactly ONE correct answer.

Return a JSON object with this exact structure:
{
  "scenarios": [
    {
      "category": "tech",
      "context": "Cash $3,800 | Debt $200 | Credit 690 | Stress 44 | Portfolio: 70% in company stock",
      "question": "Your question here?",
      "choices": [
        {"label": "A", "text": "Choice text", "isCorrect": false, "points": -20, "feedback": "Why this is wrong"},
        {"label": "B", "text": "Correct choice", "isCorrect": true, "points": 100, "feedback": "Why this is right"},
        {"label": "C", "text": "Another choice", "isCorrect": false, "points": 40, "feedback": "Why this is okay but not best"},
        {"label": "D", "text": "Bad choice", "isCorrect": false, "points": -40, "feedback": "Why this is bad"}
      ],
      "deepDive": {
        "teaching": "Main lesson from this scenario",
        "alternative": "What you should do instead",
        "ruleOfThumb": "A simple rule to remember",
        "realWorldExample": "Real example or statistic"
      }
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsed = JSON.parse(content);
    const validated = AIResponseSchema.parse(parsed);
    
    const scenarios: Scenario[] = validated.scenarios
      .filter(validateScenario)
      .map((s, index) => ({
        id: `ai-${randomUUID().slice(0, 8)}-${index}`,
        category: s.category || selectedCategories[index],
        context: s.context,
        question: s.question,
        choices: s.choices.map(c => ({
          label: c.label,
          text: c.text,
          isCorrect: c.isCorrect,
          points: c.points,
          feedback: c.feedback,
        })),
        deepDive: s.deepDive || {
          teaching: "Think carefully about financial decisions before acting.",
          alternative: null,
          ruleOfThumb: "When in doubt, sleep on it.",
          realWorldExample: "Many people regret impulsive financial decisions.",
        },
      }));

    if (scenarios.length < count) {
      console.warn(`AI generated only ${scenarios.length} valid scenarios, expected ${count}`);
      throw new Error(`Insufficient valid scenarios: ${scenarios.length}/${count}`);
    }

    return scenarios.slice(0, count);
  } catch (error) {
    console.error("Error generating AI scenarios:", error);
    throw error;
  }
}
