import { ALL_COMMANDS } from "./commands.js";
import { InstallGlobalCommands } from "./utils.js";
import { loadConfig } from "./utils.js";

loadConfig();

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
