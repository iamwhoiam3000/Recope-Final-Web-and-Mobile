export const generatePollinationsImageUrl = (
  title: string,
  description?: string
): string => {
  const prompt = `
Realistic appetizing food photography of ${title}.
${description || ""}
Restaurant-style plating, natural lighting, clean background.
No text, no logo, no watermark.
`;

  const encodedPrompt = encodeURIComponent(prompt.trim());

  const seed = encodeURIComponent(title.toLowerCase().trim());

return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&model=flux&nologo=true&seed=${seed}`;
};