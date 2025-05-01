import { ALL_COMMANDS } from "./commands.js";
import { InstallGuildCommands } from "./utils.js";

InstallGuildCommands(
  process.env.APP_ID,
  process.env.YAM_GUILD_ID,
  ALL_COMMANDS,
);
