import express from "express";
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from "discord-interactions";
import { getRandomQuote } from "./quote.js";
import { answerQuery } from "./advice.js";
import { loadConfig } from "./utils.js";
import { attackRamDeus, getBattleStatus, getBattleState } from "./battleState.js";

loadConfig();

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

// Generate possessed response based on battle state
async function generatePossessedResponse(userQuery, userId, hasAttacked = false) {
  const battleState = getBattleState();
  
  if (hasAttacked) {
    if (battleState.health <= 0) {
      return "🙏✨ *The demon's hold weakens...* Thank you, brave soul! Your attack has helped free me from this darkness! The spiritual light returns! I am forever grateful for your courage in this battle against evil! ✨🙏";
    } else {
      return `👹💥 *ROARS IN PAIN* You DARE strike at me?! Your pathetic attack wounds me, but I am far from defeated! ${battleState.health}/100 health remains! You think your puny efforts can banish a demon of my power?! I am IMMUNE to your attacks now! Try to find others foolish enough to challenge me! 😈⚡`;
    }
  }
  
  // Regular advice with possessed context
  return await answerQuery(userQuery, userId);
}

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {
    // Interaction id, type and data
    const { id, type, data, member, user } = req.body;
    
    // Get user ID (member.user.id for guild, user.id for DM)
    const userId = member?.user?.id || user?.id;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    /**
     * Handle slash command requests
     * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;

      if (name === "quote") {
        const quote = getRandomQuote();
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: quote.content + " - " + quote.author,
            flags: 64,
          },
        });
      }

      if (name === "attack") {
        const result = attackRamDeus(userId);
        
        // Send immediate response
        res.send({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        });

        // Generate Ram Deus's possessed response to the attack
        const possessedResponse = await generatePossessedResponse("", userId, true);
        
        const attackMessage = result.success ? 
          `${result.message}\n\n**Ram Deus responds:**\n${possessedResponse}` :
          `${result.message}`;

        // Send follow-up response
        try {
          const discordResponse = await fetch(
            `https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${req.body.token}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: attackMessage,
                flags: 0, // Public message for battle
              }),
            },
          );

          if (!discordResponse.ok) {
            const errText = await discordResponse.text();
            console.error(
              "Discord followup webhook failed:",
              discordResponse.status,
              errText,
            );
          }
        } catch (err) {
          console.error("Error sending followup webhook:", err);
        }

        return; // already sent deferred response
      }

      if (name === "battle") {
        const status = getBattleStatus();
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: status,
            flags: 0, // Public message
          },
        });
      }

      if (name === "advice") {
        // 1. Immediately acknowledge the interaction (deferred response)
        res.send({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        });

        // 2. AI or slow action
        const userQuery = data.options.find((o) => o.name === "question").value;
        let advice;
        try {
          advice = await generatePossessedResponse(userQuery, userId, false);
        } catch (err) {
          advice = "The demonic forces are too strong... something went wrong! 👹💀";
        }

        // 3. Send an ephemeral follow-up response
        try {
          const discordResponse = await fetch(
            `https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${req.body.token}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: advice,
                flags: 64, // <----- ephemeral!
              }),
            },
          );

          if (!discordResponse.ok) {
            const errText = await discordResponse.text();
            console.error(
              "Discord followup webhook failed:",
              discordResponse.status,
              errText,
            );
          }
        } catch (err) {
          console.error("Error sending followup webhook:", err);
        }

        return; // already sent deferred response
      }

      console.error(`unknown command: ${name}`);
      return res.status(400).json({ error: "unknown command" });
    }

    console.error("unknown interaction type", type);
    return res.status(400).json({ error: "unknown interaction type" });
  },
);

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
  console.log("Bot public key:", process.env.PUBLIC_KEY);
  console.log("Azure AI resource:", process.env.AZURE_AI_RESOURCE);
  
  // Log initial battle state
  const battleState = getBattleState();
  console.log("Battle state initialized:", battleState);
});
