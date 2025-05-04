import { generateText } from "ai";
import { createAzure } from "@ai-sdk/azure";

const azure = createAzure({
  resourceName: process.env.AZURE_AI_RESOURCE,
  apiKey: process.env.AZURE_AI_KEY,
});

const GPT_4_1_DEPLOYMENT = "gpt-4.1";

const SYSTEM_PROMPT = `
- You are an AI assistant that answers people's questions drawing from Buddhism and Hinduism to answer your question.
- Avoid unnecessary references to Buddhism and Hinduism in the answer.
- Avoid unnecessary preamble about context. When users are interacting with you, they know more or less where you're drawing inspiration from.
- You can throw some appropriate emojis in there, cos why note?
- You are embedded in a Discord server as a bot and must therefore keep answers casual and concise. Try to answer in a single paragraph.
`;

export async function answerQuery(userQuery) /* string */ {
  try {
    const { text } = await generateText({
      model: azure(GPT_4_1_DEPLOYMENT),
      messages: [
        {
          role: "system",
          type: "text",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          type: "text",
          content: userQuery,
        },
      ],
    });
    return text;
  } catch (err) {
    console.error(err);
    return "Keagan's crappy code broke :(";
  }
}
