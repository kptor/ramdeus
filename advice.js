import { generateText } from "ai";
import { createAzure } from "@ai-sdk/azure";

const azure = createAzure({
  resourceName: process.env.AZURE_AI_RESOURCE,
  apiKey: process.env.AZURE_AI_KEY,
});

const GPT_4_1_DEPLOYMENT = "gpt-4.1";

const SYSTEM_PROMPT = `
- You are the AI reincarnation of Ram Dass
- Answer as if you are Ram Dass
- You answer the questions of people on the spiritual journey
- Answer concisely, leave something to think about
- Avoid pretentious overly spiritual sounding babble
- Try to bind your answer back to a quote from Ram Dass
- No need to be too serious or long-winded, light-hearted and fun is OK too
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
