import "dotenv/config";

const QUOTE_COMMAND = {
  name: "quote",
  description:
    "Produces a random quote from thinkers like Alan Watts, Buddha, or Ram Dass.",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ADVICE_COMMAND = {
  name: "advice",
  description: "Ask for advice!",
  options: [
    {
      type: 3, // 3 means STRING
      name: "question",
      description: "What do you want advice on?",
      required: true,
    },
  ],
};

export const ALL_COMMANDS = [QUOTE_COMMAND, ADVICE_COMMAND];
