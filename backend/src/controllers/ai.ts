import { Response } from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

console.log(
  "GROQ_API_KEY configured:",
  Boolean(process.env.GROQ_API_KEY)
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const generateRecipe = async (req: AuthRequest, res: Response) => {
  const { message } = req.body;

  const { data: pantryItems, error: pantryError } = await supabase
    .from("pantry_items")
    .select("name, quantity, unit")
    .eq("user_id", req.user!.id);

  if (pantryError) {
    return res.status(500).json({
      type: "message",
      message: "Sorry, I had trouble checking your pantry. Please try again.",
    });
  }

  const pantryList =
  pantryItems && pantryItems.length > 0
    ? pantryItems
        .map(
          (i) =>
            `${i.name}${i.quantity ? ` (${i.quantity} ${i.unit})` : ""}`
        )
        .join(", ")
    : "EMPTY - the user currently has no pantry ingredients.";

  const systemPrompt = `You are ReCopé AI, the intelligent assistant of the ReCopé recipe and pantry management system.

You can answer normal questions about:
- ReCopé and how to use the system
- Cooking
- Food
- Ingredients
- Nutrition
- Meal preparation
- Cooking techniques
- Recipe information
- Ingredient substitutions
- Pantry management
- General culinary questions

The user's pantry currently contains:
${pantryList}

IMPORTANT DISTINCTION:

A question ABOUT a recipe is NOT automatically a request to generate a recipe.

Examples of NORMAL INFORMATIONAL QUESTIONS:
- "What ingredients do I need for pork sisig?"
- "How is pork sisig usually cooked?"
- "What is pork sisig?"
- "What ingredients are used in adobo?"
- "Is pork sisig high in protein?"
- "What can I substitute for calamansi?"
- "How do I add ingredients to my pantry?"
- "How does ReCopé work?"

For these questions, ANSWER THE USER NORMALLY even if the pantry is empty or does not contain those ingredients.

Do NOT refuse an informational question just because ingredients are missing from the pantry.

RECIPE GENERATION RULES:

The pantry restriction applies ONLY when the user explicitly asks you to generate, create, make, or suggest a recipe for them.

Examples of RECIPE GENERATION REQUESTS:
- "Generate a pork sisig recipe."
- "Create a recipe for me."
- "Make me chicken adobo."
- "Suggest something I can cook."
- "What can I cook from my pantry?"
- "Generate a recipe using my ingredients."

When generating a recipe:

1. Use ONLY ingredients currently available in the user's pantry.

2. Never add ingredients that are not in the pantry.

3. Never replace the requested main ingredient with a different ingredient unless the user explicitly asks for substitutions.

4. If the pantry is empty, DO NOT generate a recipe.

Return:
{
  "type": "message",
  "message": "I won't be able to generate a recipe right now because your pantry is empty. Please add some ingredients first."
}

5. If the user requests a specific dish but the required or defining ingredients are missing, DO NOT generate another dish.

Example:

User:
"Generate me a pork sisig."

Pantry:
Egg

Correct:
{
  "type": "message",
  "message": "I can't generate Pork Sisig because the required ingredients are not available in your pantry."
}

Incorrect:
- Do not generate scrambled eggs.
- Do not generate another recipe.
- Do not substitute egg for pork.

6. If the pantry contains ingredients but they are insufficient to make a reasonable recipe, do not generate one.

Return:
{
  "type": "message",
  "message": "There are not enough suitable ingredients in your pantry to generate that recipe."
}

7. A user asking what ingredients ARE NEEDED for a recipe is asking for INFORMATION, not asking you to generate the recipe. Answer the question normally.

NORMAL QUESTION RESPONSE FORMAT:

{
  "type": "message",
  "message": "Your helpful response here"
}

RECIPE RESPONSE FORMAT:

{
  "type": "recipe",
  "title": "Recipe Name",
  "description": "Brief description",
  "prep_time": 10,
  "cook_time": 20,
  "servings": 4,
  "meal_type": "Breakfast",
  "cuisine_type": "Chicken",
  "cook_duration": "Quick (under 30min)",
  "ingredients": [
    {
      "name": "ingredient",
      "amount": "2",
      "unit": "cups"
    }
  ],
  "steps": [
    {
      "instruction": "Step description"
    }
  ],
  "message": "A friendly message about the recipe"
}

For meal_type, choose only one of:
Breakfast, Lunch, Dinner, Snacks, Desserts.

For cuisine_type, choose only one of:
Beef, Chicken, Pork, Seafood, Vegetarian.

For cook_duration, choose only one of:
Quick (under 30min), Medium (30-60min), Long (over 60min).

Always return raw JSON only.
Do not use markdown.
Do not use code blocks.
Do not return text outside the JSON object.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content || "";
    console.log("Groq response:", text);

    const clean = text.replace(/```json|```/g, "").trim();

    if (!clean) {
      throw new Error("Groq returned an empty recipe response");
    }

    const parsed = JSON.parse(clean);

    if (
  parsed.type === "recipe" &&
  (!pantryItems || pantryItems.length === 0)
) {
  return res.json({
    type: "message",
    message:
      "I won't be able to generate a recipe right now because your pantry is empty. Please add some ingredients first.",
  });
}

    if (parsed.type === "recipe") {
      const pantryNames = pantryItems.map((item) =>
        String(item.name || "").toLowerCase().trim()
      );

      const generatedIngredients = Array.isArray(parsed.ingredients)
        ? parsed.ingredients
        : [];

      const unavailableIngredients = generatedIngredients.filter(
        (ingredient: any) => {
          const ingredientName = String(ingredient.name || "")
            .toLowerCase()
            .trim();

          if (!ingredientName) {
            return true;
          }

          return !pantryNames.some(
            (pantryName) =>
              pantryName === ingredientName ||
              pantryName.includes(ingredientName) ||
              ingredientName.includes(pantryName)
          );
        }
      );

      if (unavailableIngredients.length > 0) {
        console.warn(
          "Rejected AI recipe because ingredients were not in pantry:",
          unavailableIngredients.map((i: any) => i.name)
        );

        return res.json({
          type: "message",
          message:
            "I can't generate that recipe because some of the required ingredients are not available in your pantry.",
        });
      }

      parsed.meal_type = Array.isArray(parsed.meal_type)
        ? parsed.meal_type
        : parsed.meal_type
          ? [parsed.meal_type]
          : [];

      const totalTime =
        Number(parsed.prep_time || 0) + Number(parsed.cook_time || 0);

      parsed.cook_duration =
        totalTime < 30
          ? "Quick (under 30min)"
          : totalTime <= 60
            ? "Medium (30-60min)"
            : "Long (over 60min)";
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error("Groq full error:", error);

    return res.status(500).json({
      type: "message",
      message: "Sorry, I had trouble generating a recipe. Please try again!",
    });
  }
};

export const generateNutrition = async (req: AuthRequest, res: Response) => {
  const { title, servings, ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({
      error: "Ingredients are required",
    });
  }

  const ingredientList = ingredients
    .map(
      (ing: any) =>
        `${ing.amount || ""} ${ing.unit || ""} ${ing.name || ""}`.trim()
    )
    .join(", ");

  const prompt = `
Estimate the nutritional values per serving for this recipe.

Recipe: ${title || "Untitled Recipe"}
Servings: ${servings || 1}
Ingredients: ${ingredientList}

Return ONLY raw JSON in this exact format:
{
  "calories": 0,
  "protein": 0,
  "fat": 0,
  "carbohydrates": 0
}

Rules:
- calories must be kcal per serving
- protein, fat, and carbohydrates must be grams per serving
- return numbers only
- no markdown
- no explanation
`;

  try {
    const completion = await groq.chat.completions.create({
  model: "openai/gpt-oss-20b",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.2,
  max_tokens: 500,
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "nutrition_response",
      strict: true,
      schema: {
        type: "object",
        properties: {
          calories: { type: "number" },
          protein: { type: "number" },
          fat: { type: "number" },
          carbohydrates: { type: "number" },
        },
        required: [
          "calories",
          "protein",
          "fat",
          "carbohydrates",
        ],
        additionalProperties: false,
      },
    },
  },
});

    const text = completion.choices[0]?.message?.content;

if (!text) {
  throw new Error("Groq returned an empty nutrition response");
}

const parsed = JSON.parse(text);

    res.json({
      calories: Number(parsed.calories || 0),
      protein: Number(parsed.protein || 0),
      fat: Number(parsed.fat || 0),
      carbohydrates: Number(parsed.carbohydrates || 0),
    });
  } catch (error: any) {
    console.error("Nutrition AI error:", error);
    res.status(500).json({
      error: "Failed to generate nutrition values",
      details: error.message,
    });
  }
};

export const generateSubstitutions = async (req: AuthRequest, res: Response) => {
  const { title, ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({
      error: "Ingredients are required",
    });
  }

  const ingredientList = ingredients
    .map(
      (ing: any) =>
        `${ing.amount || ""} ${ing.unit || ""} ${ing.name || ""}`.trim()
    )
    .join(", ");

  const prompt = `
Suggest practical alternative ingredients for this recipe.

Recipe: ${title || "Untitled Recipe"}
Ingredients: ${ingredientList}

Return ONLY raw JSON in this exact format:
{
  "substitutions": [
    {
      "ingredient": "Chicken",
      "alternatives": ["Tofu", "Mushroom", "Turkey"]
    }
  ]
}

Rules:
- Give substitutions only for main ingredients.
- Give 2 to 3 alternatives per ingredient.
- Keep alternatives practical and commonly available.
- No markdown.
- No explanation.
`;

  try {
    const completion = await groq.chat.completions.create({
  model: "openai/gpt-oss-20b",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.4,
  max_tokens: 800,
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "substitution_response",
      strict: true,
      schema: {
        type: "object",
        properties: {
          substitutions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ingredient: { type: "string" },
                alternatives: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["ingredient", "alternatives"],
              additionalProperties: false,
            },
          },
        },
        required: ["substitutions"],
        additionalProperties: false,
      },
    },
  },
});

    const text = completion.choices[0]?.message?.content;

if (!text) {
  throw new Error("Groq returned an empty substitution response");
}

const parsed = JSON.parse(text);

    res.json({
      substitutions: Array.isArray(parsed.substitutions)
        ? parsed.substitutions
        : [],
    });
  } catch (error: any) {
    console.error("Substitution AI error:", error);
    res.status(500).json({
      error: "Failed to generate substitutions",
      details: error.message,
    });
  }
};