import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const generateRecipeImage = async (
  title: string,
  description?: string
): Promise<string | null> => {
  const prompt = `
Realistic appetizing food photography of "${title}".
${description || ""}
Restaurant-style plating, natural lighting, clean background.
No text, no logo, no watermark.
`;

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
  });

  return result.data?.[0]?.b64_json || null;
};