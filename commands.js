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

const ATTACK_COMMAND = {
  name: "attack",
  description: "Attack the possessed Ram Deus! Join the battle to free him from the demon! ⚔️👹",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const BATTLE_STATUS_COMMAND = {
  name: "battle",
  description: "Check the current battle status against the possessed Ram Deus 👹⚔️",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export const ALL_COMMANDS = [QUOTE_COMMAND, ADVICE_COMMAND, ATTACK_COMMAND, BATTLE_STATUS_COMMAND];
