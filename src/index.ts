import { Command } from "commander";

import { registerAuthCommands } from "./commands/auth";
import { registerConfigCommands } from "./commands/config";
import { registerWorkflowCommands } from "./commands/workflow";
import { registerInstallCommands } from "./commands/install";

const program = new Command();

program
  .name("gdk")
  .description("GoDezk Workflow CLI")
  .version("0.4.0");

// Register Commands
registerAuthCommands(program);
registerConfigCommands(program);
registerWorkflowCommands(program);
registerInstallCommands(program);

// Parse CLI
program.parse(process.argv);

// Show welcome message if no command is provided
if (!process.argv.slice(2).length) {
  console.log("");
  console.log("🚀 Welcome to GoDezk CLI");
  console.log("");
  console.log("Run 'gdk --help' to see available commands.");
}