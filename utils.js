import "dotenv/config";

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = "https://discord.com/api/v10/" + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent":
        "DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)",
    },
    ...options,
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    console.log("Registering the following commands:");
    console.log(JSON.stringify(commands, null, 2));
    await DiscordRequest(endpoint, { method: "PUT", body: commands });
  } catch (err) {
    console.error(err);
  }
}

export async function InstallGuildCommands(appId, guildId, commands) {
  // Guild endpoint: applications/{APP_ID}/guilds/{GUILD_ID}/commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  try {
    console.log(
      "Registering the following commands for guild " + guildId + ":",
    );
    console.log(JSON.stringify(commands, null, 2));
    // Use bulk overwrite endpoint for guild commands
    await DiscordRequest(endpoint, { method: "PUT", body: commands });
    console.log("Guild commands registered successfully!");
  } catch (err) {
    console.error("Error registering guild commands:", err);
  }
}
