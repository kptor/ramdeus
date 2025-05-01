import seedrandom from "seedrandom";

// Seed our RNG with the current timestamp so that each session produces a different sequence.
const rng = seedrandom(String(Date.now()));

// An improved quotes array where each quote is an object with a content and an author property.
const QUOTES = [
  {
    content: "The quieter you become, the more you can hear.",
    author: "Ram Dass",
  },
  { content: "We're all just walking each other home.", author: "Ram Dass" },
  {
    content:
      "Everything in your life is there as a vehicle for your transformation. Use it!",
    author: "Ram Dass",
  },
  { content: "Treat everyone you meet like God in drag.", author: "Ram Dass" },
  {
    content:
      "I would like my life to be a statement of love and compassion—and where it isn't, that's where my work lies.",
    author: "Ram Dass",
  },

  // Alan Watts quotes
  {
    content: "Trying to define yourself is like trying to bite your own teeth.",
    author: "Alan Watts",
  },
  {
    content:
      "The only way to make sense out of change is to plunge into it, move with it, and join the dance.",
    author: "Alan Watts",
  },
  {
    content:
      "This is the real secret of life—to be completely engaged with what you are doing in the here and now.",
    author: "Alan Watts",
  },

  // Eckhart Tolle quotes
  {
    content:
      "Realize deeply that the present moment is all you have. Make the NOW the primary focus of your life.",
    author: "Eckhart Tolle",
  },
  {
    content:
      "Life will give you whatever experience is most helpful for the evolution of your consciousness.",
    author: "Eckhart Tolle",
  },

  // Thich Nhat Hanh quotes
  { content: "Smile, breathe, and go slowly.", author: "Thich Nhat Hanh" },
  {
    content: "There is no way to happiness - happiness is the way.",
    author: "Thich Nhat Hanh",
  },

  // Buddha quotes
  {
    content: "Peace comes from within. Do not seek it without.",
    author: "Buddha",
  },
  {
    content:
      "What you think, you become. What you feel, you attract. What you imagine, you create.",
    author: "Buddha",
  },

  // Lao Tzu quote
  {
    content: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
  },

  // Rumi quotes
  {
    content: "The wound is the place where the Light enters you.",
    author: "Rumi",
  },
  {
    content:
      "Lose yourself completely, return to the source, and you will be folded in.",
    author: "Rumi",
  },
];

// Keep track of the last quote index so we don’t return the same quote consecutively.
let lastQuoteIndex = -1;

export function getRandomQuote() {
  let index = Math.floor(rng() * QUOTES.length);

  // Ensure we don't return the same quote twice in two successive calls.
  if (QUOTES.length > 1 && index === lastQuoteIndex) {
    index = (index + 1) % QUOTES.length;
  }

  lastQuoteIndex = index;
  return QUOTES[index];
}
