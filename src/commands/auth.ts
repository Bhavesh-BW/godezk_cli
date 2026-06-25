import { Command } from "commander";

export function registerAuthCommands(program: Command): void {

    const auth = program
        .command("auth")
        .description("Authentication commands");

    auth
        .command("login")
        .description("Login to GoDezk");

    auth
        .command("logout")
        .description("Logout");

    auth
        .command("whoami")
        .description("Show current logged in user");
}