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
import path from "path";
import fs from "fs";

loadConfig();

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Handles sending a deferred response and following up with the actual content
 * @param {Object} res - Express response object
 * @param {Object} req - Express request object
 * @param {Function} contentGenerator - Async function that generates the response content
 * @param {number} flags - Discord message flags
 */
async function sendDeferredResponse(res, req, contentGenerator, flags) {
  console.log("sendDeferredResponse: Starting deferred response");
  
  // 1. Immediately acknowledge the interaction
  res.send({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  });
  console.log("sendDeferredResponse: Sent initial deferred response");

  // 2. Generate the response content
  let content;
  try {
    console.log("sendDeferredResponse: Starting content generation");
    content = await contentGenerator();
    console.log("sendDeferredResponse: Content generated successfully, length:", content?.length);
  } catch (err) {
    console.error("sendDeferredResponse: Error in content generation:", err);
    content = "The demonic forces are too strong... something went wrong! 👹💀";
  }

  // 3. Send follow-up response
  try {
    const applicationId = req.body.application_id;
    console.log("sendDeferredResponse: Sending webhook to applicationId:", applicationId);
    
    const discordResponse = await fetch(
      `https://discord.com/api/v10/webhooks/${applicationId}/${req.body.token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          flags,
        }),
      }
    );

    console.log("sendDeferredResponse: Webhook response status:", discordResponse.status);

    if (!discordResponse.ok) {
      const errText = await discordResponse.text();
      console.error(
        "Discord followup webhook failed:",
        discordResponse.status,
        errText
      );
    } else {
      console.log("sendDeferredResponse: Webhook sent successfully");
    }
  } catch (err) {
    console.error("Error sending followup webhook:", err);
  }
  
  console.log("sendDeferredResponse: Function completed");
}

/**
 * Health check endpoint that verifies:
 * 1. Server is running
 * 2. Battle state JSON file can be loaded and parsed correctly
 * 3. Data directory is writable for battleState.json operations
 */
app.get("/health", (req, res) => {
  const healthChecks = {
    server: false,
    battleStateFileRead: false,
    battleStateFileParse: false,
    battleStateFileWrite: false,
    dataDirectoryAccess: false
  };
  
  const errors = [];
  
  try {
    // Check 1: Server is running (if we get here, server is running)
    healthChecks.server = true;
    
    // Check 2: Verify battle state file can be loaded and parsed
    try {
      const battleState = getBattleState();
      healthChecks.battleStateFileRead = true;
      
      // Verify required properties exist and are correct types
      if (typeof battleState.health !== 'number' || 
          !Array.isArray(battleState.attackedBy) ||
          typeof battleState.isDefeated !== 'boolean') {
        errors.push('Battle state JSON has invalid structure or missing required fields');
      } else {
        healthChecks.battleStateFileParse = true;
      }
    } catch (error) {
      errors.push(`Battle state file loading/parsing error: ${error.message}`);
    }
    
    // Check 3: Verify data directory is accessible
    try {
      const dataDir = process.env.RAMDEUS_DATA_DIR || process.cwd();
      const battleStateFile = path.join(dataDir, 'battleState.json');
      
      // Check if we can access the directory
      fs.accessSync(dataDir, fs.constants.R_OK | fs.constants.W_OK);
      healthChecks.dataDirectoryAccess = true;
      
      // Test write capability by saving current battle state
      if (healthChecks.battleStateFileRead && healthChecks.battleStateFileParse) {
        const currentState = getBattleState();
        const testData = JSON.stringify(currentState, null, 2);
        
        // Write the battle state (this should work if everything is healthy)
        fs.writeFileSync(battleStateFile, testData);
        
        // Read it back and verify it parses correctly
        const readBackData = fs.readFileSync(battleStateFile, 'utf8');
        const parsedBackData = JSON.parse(readBackData);
        
        // Verify data integrity
        if (parsedBackData.health === currentState.health &&
            Array.isArray(parsedBackData.attackedBy) &&
            parsedBackData.attackedBy.length === currentState.attackedBy.length) {
          healthChecks.battleStateFileWrite = true;
        } else {
          errors.push('Battle state file write/read cycle failed data integrity check');
        }
      }
    } catch (error) {
      errors.push(`Data directory or battleState.json write test error: ${error.message}`);
    }
    
    // Determine overall health status
    const allChecksPass = Object.values(healthChecks).every(check => check === true);
    const status = allChecksPass ? "healthy" : "unhealthy";
    const httpStatus = allChecksPass ? 200 : 503;
    
    // Get battle state for response (only if it's accessible)
    let battleSystemInfo = null;
    if (healthChecks.battleStateFileRead && healthChecks.battleStateFileParse) {
      try {
        const battleState = getBattleState();
        battleSystemInfo = {
          isAccessible: true,
          currentHealth: battleState.health,
          attackerCount: battleState.attackedBy.length,
          isDefeated: battleState.isDefeated,
          lastAttackTime: battleState.lastAttackTime,
          fileLocation: path.join(process.env.RAMDEUS_DATA_DIR || process.cwd(), 'battleState.json')
        };
      } catch (error) {
        battleSystemInfo = {
          isAccessible: false,
          error: error.message
        };
      }
    }
    
    // Prepare health check response
    const healthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      dataDirectory: process.env.RAMDEUS_DATA_DIR || process.cwd(),
      battleStateFile: path.join(process.env.RAMDEUS_DATA_DIR || process.cwd(), 'battleState.json'),
      checks: healthChecks,
      errors: errors.length > 0 ? errors : undefined,
      battleSystem: battleSystemInfo
    };
    
    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    // If anything fails, return unhealthy status
    res.status(500).json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
        dataDirectory: process.env.RAMDEUS_DATA_DIR || process.cwd(),
        battleStateFile: path.join(
          process.env.RAMDEUS_DATA_DIR || process.cwd(),
          'battleState.json'
        ),
        checks: healthChecks,
        errors: [
          ...errors,
          `Unexpected error: ${error.message}`
        ]
      },
      null,
      2
    );
  }
});

// Generate possessed response based on battle state
async function generatePossessedResponse(userQuery, userId, hasAttacked = false) {
  const battleState = getBattleState();
  
  let contextMessage = userQuery;
  if (hasAttacked) {
    contextMessage = `[Battle Context: You were just struck by a brave warrior! Your health is now ${battleState.health}/100. ${battleState.attackedBy.length} warriors have attacked you so far. ${battleState.health <= 0 ? "You have been defeated and freed from the demon's possession!" : `You need ${7 - battleState.attackedBy.length} more unique attackers to be defeated.`}] ${userQuery}`;
  }
  
  // Always use the language model for responses
  return await answerQuery(contextMessage, userId);
}

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {
    // Interaction type and data
    const { type, data, member, user } = req.body;
    
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
            flags: 4160, // Ephemeral (64) + suppress notifications (4096)
          },
        });
      }

      if (name === "attack") {
        console.log("Attack command: Starting for userId:", userId);
        return sendDeferredResponse(
          res,
          req,
          async () => {
            console.log("Attack command: Inside content generator");
            const result = attackRamDeus(userId);
            console.log("Attack command: attackRamDeus result:", result);
            
            console.log("Attack command: Generating possessed response");
            const battleStateMessage = `You were just struck by a brave warrior! Your health is now ${result.health}/100. ${result.attackersCount} warriors have attacked you so far. ${result.health <= 0 ? "You have been defeated and freed from the demon's possession!" : `You need ${7 - result.attackersCount} more unique attackers to be defeated.`}`;
            const possessedResponse = await generatePossessedResponse(battleStateMessage, userId, true);
            console.log("Attack command: Possessed response generated, length:", possessedResponse?.length);
            
            const finalMessage = result.success ? 
              `${result.message}\n\n**Ram Deus responds:**\n${possessedResponse}` :
              `${result.message}`;
            
            console.log("Attack command: Final message prepared, length:", finalMessage?.length);
            return finalMessage;
          },
          4096 // Public message + suppress notifications
        );
      }

      if (name === "battle-status") {
        const status = getBattleStatus();
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: status,
            flags: 4096, // Public message + suppress notifications
          },
        });
      }

      if (name === "speak") {
        const userMessage = data.options.find((o) => o.name === "message").value;
        return sendDeferredResponse(
          res,
          req,
          async () => {
            const response = await generatePossessedResponse(userMessage, userId, false);
            return `> ${userMessage}\n\n${response}`;
          },
          4096 // Public message + suppress notifications
        );
      }

      if (name === "advice") {
        const userQuery = data.options.find((o) => o.name === "question").value;
        return sendDeferredResponse(
          res,
          req,
          async () => {
            const advice = await generatePossessedResponse(userQuery, userId, false);
            return `> ${userQuery}\n\n${advice}`;
          },
          4160 // Ephemeral (64) + suppress notifications (4096)
        );
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
  console.log("Data directory:", process.env.RAMDEUS_DATA_DIR || process.cwd());
  
  // Log initial battle state
  const battleState = getBattleState();
  console.log("Battle state initialized:", battleState);
});
