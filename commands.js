import "dotenv/config";

const QUOTE_COMMAND = {
  name: "quote",
  description: "Get a cool quote from a cool guy",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export const ALL_COMMANDS = [QUOTE_COMMAND];
