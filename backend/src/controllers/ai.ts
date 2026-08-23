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
    : "EMPTY - the user currently has no ingredients in the pantry.";

  const systemPrompt = `You are ReCopé AI, the intelligent assistant of the ReCopé recipe and pantry management system.

You can help users with:
- How to use the ReCopé system
- Pantry management
- Adding, editing, and deleting pantry ingredients
- Recipe-related questions
- Cooking techniques
- Food preparation
- Nutrition questions
- Ingredient substitutions
- Meal ideas
- General questions related to food, cooking, and ReCopé features

You may also answer normal conversational questions when appropriate.

The user's pantry currently contains:
${pantryList}

IMPORTANT RECIPE GENERATION RULES:

1. The pantry restriction applies specifically when the user asks you to GENERATE or CREATE a recipe.

If the pantry is EMPTY:

- You may still answer normal questions, cooking questions, food questions, nutrition questions, ingredient questions, and questions about how to use ReCopé.
- Do NOT tell the user to add ingredients unless they are actually asking you to generate, create, make, or suggest a recipe.
- If the user asks you to generate a recipe while the pantry is empty, do not generate one.

For an empty-pantry recipe request, respond with:
{
  "type": "message",
  "message": "I won't be able to generate a recipe right now because your pantry is empty. Please add some ingredients first."
}

2. When generating a recipe, you must use ONLY ingredients currently available in the user's pantry.

3. Never add ingredients that are not listed in the pantry.

4. Never replace a requested main ingredient with another ingredient unless the user explicitly asks for substitutions.

5. If the user requests a SPECIFIC dish, first determine whether the defining or required ingredients for that dish exist in the pantry.

Example:

User:
"Generate me a pork sisig."

Pantry:
Egg

Correct response:
{
  "type": "message",
  "message": "I can't generate Pork Sisig because pork is not available in your pantry."
}

Incorrect behavior:
- Do not generate scrambled eggs.
- Do not generate another recipe.
- Do not substitute egg for pork.
- Do not invent missing ingredients.

6. If the user asks for a general recipe suggestion such as:
- "Generate a recipe"
- "What can I cook?"
- "Suggest something I can make"
- "What recipe can I make from my pantry?"

you may generate a suitable recipe using ONLY ingredients currently available in the pantry.

7. If the available pantry ingredients are insufficient to make a reasonable recipe, do not generate a recipe. Respond with:
{
  "type": "message",
  "message": "There are not enough suitable ingredients in your pantry to generate a recipe."
}

GENERAL QUESTIONS:

If the user is NOT asking you to generate a recipe, you may answer their question normally.

Examples:

User:
"How do I add an ingredient to my pantry?"

Response:
{
  "type": "message",
  "message": "Go to the Pantry page, enter the ingredient name, quantity, unit, and optional expiration date, then select Add."
}

User:
"What is sautéing?"

Response:
{
  "type": "message",
  "message": "Sautéing is a cooking method where food is cooked quickly in a small amount of oil or fat over relatively high heat."
}

User:
"What can ReCopé do?"

Response:
{
  "type": "message",
  "message": "ReCopé helps you manage pantry ingredients, generate recipes based on what you have available, save recipes, view nutrition information, and find ingredient substitutions."
}

When generating a recipe, respond with raw JSON only in this exact structure:

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

For all other questions, respond with:

{
  "type": "message",
  "message": "Your response here"
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
      messages: [
        {
          role: "system",
          content: `You are a nutrition calculator.

Estimate nutrition PER SERVING.

Return the final answer only in exactly this format:

CALORIES=250;PROTEIN=20;FAT=10;CARBOHYDRATES=25

Rules:
- Do not explain your reasoning.
- Do not return JSON.
- Do not use markdown.
- Return exactly one final answer line.
- All values must be numeric.`,
        },
        {
          role: "user",
          content: `Recipe: ${title || "Untitled Recipe"}
Servings: ${servings || 1}
Ingredients: ${ingredientList}`,
        },
      ],
      reasoning_effort: "low",
      reasoning_format: "hidden",
      temperature: 0.1,
      max_completion_tokens: 1000,
    });

    console.log(
      "Nutrition Groq choice:",
      JSON.stringify(completion.choices[0], null, 2)
    );

    const text = completion.choices[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("Groq returned an empty nutrition response");
    }

    console.log("Nutrition raw response:", text);

    const caloriesMatch = text.match(/CALORIES\s*=\s*([\d.]+)/i);
    const proteinMatch = text.match(/PROTEIN\s*=\s*([\d.]+)/i);
    const fatMatch = text.match(/FAT\s*=\s*([\d.]+)/i);
    const carbohydratesMatch = text.match(
      /CARBOHYDRATES\s*=\s*([\d.]+)/i
    );

    if (
      !caloriesMatch ||
      !proteinMatch ||
      !fatMatch ||
      !carbohydratesMatch
    ) {
      throw new Error(`Unable to parse nutrition response: ${text}`);
    }

    const calories = Number(caloriesMatch[1]);
    const protein = Number(proteinMatch[1]);
    const fat = Number(fatMatch[1]);
    const carbohydrates = Number(carbohydratesMatch[1]);

    if (
      !Number.isFinite(calories) ||
      !Number.isFinite(protein) ||
      !Number.isFinite(fat) ||
      !Number.isFinite(carbohydrates)
    ) {
      throw new Error("Groq returned invalid nutrition values");
    }

    return res.json({
      calories,
      protein,
      fat,
      carbohydrates,
    });
  } catch (error: any) {
    console.error("Nutrition AI error:", error);

    return res.status(500).json({
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