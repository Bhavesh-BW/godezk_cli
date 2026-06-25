import { Command } from "commander";
import { getServer, setServer } from "../config/config";

export function registerConfigCommands(program: Command): void {

    const config = program
        .command("config")
        .description("Manage CLI configuration");

    config
        .command("set")
        .description("Set configuration value")
        .argument("<key>", "Configuration key")
        .argument("<value>", "Configuration value")
        .action((key: string, value: string) => {

            switch (key) {

                case "server":
                    setServer(value);
                    console.log(`✅ Server saved: ${value}`);
                    break;

                default:
                    console.log(`❌ Unknown configuration key: ${key}`);
            }

        });

    config
        .command("get")
        .description("Get configuration value")
        .argument("<key>", "Configuration key")
        .action((key: string) => {

            switch (key) {

                case "server":
                    console.log(getServer() ?? "Not Set");
                    break;

                default:
                    console.log(`❌ Unknown configuration key: ${key}`);
            }

        });

    config
        .command("list")
        .description("Show all configuration")
        .action(() => {

            console.log("");
            console.log("Current Configuration");
            console.log("----------------------");
            console.log(`Server : ${getServer() ?? "Not Set"}`);
            console.log("");

        });

}