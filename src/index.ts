import { Command } from "commander";

const program = new Command();

program
  .name("gdk")
  .description("GoDezk Workflow CLI")
  .version("0.1.0");

program.parse(process.argv);

if (process.argv.length <= 2) {
  console.log("");  
  console.log("🚀 Welcome to GoDezk CLI");
  console.log("");
  console.log("Version : 0.1.0");
  console.log("");
  console.log("Run 'gdk --help' to see available commands.");
}