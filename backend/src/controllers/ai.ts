import { Response } from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

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

  if (!pantryItems || pantryItems.length === 0) {
    return res.json({
      type: "message",
      message:
        "Sorry I won't be able to generate a recipe right now. Please enter an ingredient in the pantry.",
    });
  }

  const pantryList = pantryItems
    .map((i) => `${i.name}${i.quantity ? ` (${i.quantity} ${i.unit})` : ""}`)
    .join(", ");

  const systemPrompt = `You are ReCopé's AI recipe assistant. You generate recipes ONLY from the user's pantry ingredients.

The user's pantry currently contains: ${pantryList}

Rules:
- You must only generate recipes using the user's pantry ingredients.
- Do not generate recipes that require ingredients not listed in the pantry.
- If the user asks for a recipe that cannot be made with the pantry ingredients, suggest a recipe that can be made from the pantry instead.
- If the user is just chatting or asking a general question, respond normally as a helpful assistant.

When generating a recipe, ALWAYS respond with a JSON object in this exact format with no markdown or code blocks, just raw JSON:
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
    { "name": "ingredient", "amount": "2", "unit": "cups" }
  ],
  "steps": [
    { "instruction": "Step description" }
  ],
  "message": "A friendly message about the recipe"
}

If the user is just chatting or asking a question, respond with:
{
  "type": "message",
  "message": "Your response here"
}

For meal_type, choose only one of: Breakfast, Lunch, Dinner, Snacks, Desserts.
For cuisine_type, choose only one of: Beef, Chicken, Pork, Seafood, Vegetarian.
For cook_duration, choose only one of: Quick (under 30min), Medium (30-60min), Long (over 60min).

Always return raw JSON only, no markdown, no code blocks.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content || "";
    console.log("Groq response:", text);

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (parsed.type === "recipe") {
      parsed.meal_type = Array.isArray(parsed.meal_type)
        ? parsed.meal_type
        : parsed.meal_type
          ? [parsed.meal_type]
          : [];

      const totalTime = Number(parsed.prep_time || 0) + Number(parsed.cook_time || 0);

      parsed.cook_duration =
        totalTime < 30
          ? "Quick (under 30min)"
          : totalTime <= 60
            ? "Medium (30-60min)"
            : "Long (over 60min)";
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Groq full error:", error);
    res.status(500).json({
      type: "message",
      message: "Sorry, I had trouble generating a recipe. Please try again!",
      error: error.message,
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
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

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
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 250,
    });

    const text = completion.choices[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

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