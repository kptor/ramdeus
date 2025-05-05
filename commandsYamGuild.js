import { ALL_COMMANDS } from "./commands.js";
import { InstallGuildCommands } from "./utils.js";
import { loadConfig } from "./utils.js";

loadConfig();

InstallGuildCommands(
  process.env.APP_ID,
  process.env.YAM_GUILD_ID,
  ALL_COMMANDS,
);
