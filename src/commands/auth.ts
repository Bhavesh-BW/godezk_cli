import { Command } from "commander";
import inquirer from "inquirer";
import {
  getServer,
  setServer,
  setToken,
  setUser,
  setOrgId,
  setModules,
  setPermissions,
  clearSession,
  getUser,
  isAuthenticated,
} from "../config/config";
import { login } from "../api/auth";

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command("auth")
    .description("Authentication commands");

  auth
    .command("login")
    .description("Login to GoDezk")
    .action(async () => {
      let serverUrl = getServer();

      if (!serverUrl) {
        const serverAnswer = await inquirer.prompt([
          {
            type: "input",
            name: "server",
            message: "Server URL:",
            default: "http://localhost:8090",
          },
        ]);
        serverUrl = serverAnswer.server;
        if (!serverUrl) {
          console.error("❌ Server URL is required.");
          process.exit(1);
        }
        setServer(serverUrl);
      }

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "email",
          message: "Email:",
          validate: (input: string) => {
            if (!input.trim()) return "Email is required.";
            if (!input.includes("@")) return "Please enter a valid email address.";
            return true;
          },
        },
        {
          type: "password",
          name: "password",
          message: "Password:",
          mask: "*",
          validate: (input: string) => {
            if (!input) return "Password is required.";
            if (input.length < 6) return "Password must be at least 6 characters.";
            return true;
          },
        },
      ]);

      try {
        const data = await login(answers.email.trim(), answers.password);

        setToken(data.token);
        setUser(data.user);
        setOrgId(data.user.org_id);

        if (data.allowed_modules) {
          setModules(data.allowed_modules);
        }
        if (data.allowed_permissions) {
          setPermissions(data.allowed_permissions);
        }

        const orgName = data.user.org_name || data.user.org_id;
        console.log(`\n✅ Logged in as ${data.user.email} (org: ${orgName})`);
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Login failed. Please check your credentials and try again.";
        console.error(`\n❌ ${message}`);
        process.exit(1);
      }
    });

  auth
    .command("logout")
    .description("Logout from GoDezk")
    .action(() => {
      clearSession();
      console.log("👋 Logged out");
    });

  auth
    .command("whoami")
    .description("Show current logged in user")
    .action(() => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      const user = getUser();
      if (!user) {
        console.log("❌ User data missing. Run: gdk auth login");
        return;
      }

      console.log("");
      console.log("Current User");
      console.log("------------");
      console.log(`Email   : ${user.email}`);
      console.log(`Name    : ${user.full_name}`);
      console.log(`Role    : ${user.role}`);
      console.log(`Org ID  : ${user.org_id}`);
      if (user.org_name) {
        console.log(`Org Name: ${user.org_name}`);
      }
      console.log("");
    });
}