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

  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;
};