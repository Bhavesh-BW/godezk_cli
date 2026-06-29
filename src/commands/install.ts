import { Command } from "commander";
import { isAuthenticated, getOrgId } from "../config/config";
import {
  getInstallations,
  getInstallation,
  activateInstallation,
  deactivateInstallation,
  uninstallInstallation,
} from "../api/installations";
import { WorkflowInstallation } from "../types/installation";

async function resolveInstallationId(id: string): Promise<string> {
  if (id.length === 36) return id;

  const orgId = getOrgId();
  if (!orgId) {
    console.error("❌ Organization not configured. Run 'gdk auth login' to set your org.");
    process.exit(1);
  }

  const data = await getInstallations(orgId);
  const installations = data.installations ?? [];
  const matches = installations.filter((i) => i.id.endsWith(id));

  if (matches.length === 0) {
    console.error("❌ Installation ID not found. Run 'gdk install list' to see valid IDs.");
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error("❌ Multiple installations match that ID suffix:");
    console.log("");
    matches.forEach((i) => {
      console.log(`  ${i.id}  —  ${i.name ?? "Unknown"}`);
    });
    console.log("");
    console.error("Please use more characters to disambiguate.");
    process.exit(1);
  }
  return matches[0].id;
}

function padEnd(str: string, len: number): string {
  const s = String(str ?? "");
  return s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);
}

function formatTable(headers: string[], rows: string[][], widths: number[]): string {
  const sep = " | ";
  const headerLine = headers.map((h, i) => padEnd(h, widths[i])).join(sep);
  const divider = widths.map((w) => "-".repeat(w)).join("-+-");
  const body = rows.map((row) =>
    row.map((cell, i) => padEnd(cell, widths[i])).join(sep)
  );
  return [headerLine, divider, ...body].join("\n");
}

export function registerInstallCommands(program: Command): void {
  const install = program
    .command("install")
    .description("Manage installed workflows");

  install
    .command("list")
    .description("List installed workflows for your organization")
    .action(async () => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      const orgId = getOrgId();
      if (!orgId) {
        console.error("❌ Organization not configured. Run 'gdk auth login' to set your org.");
        process.exit(1);
      }

      try {
        const data = await getInstallations(orgId);
        const installations = data.installations ?? [];

        if (installations.length === 0) {
          console.log("No installed workflows found.");
          return;
        }

        const headers = ["ID", "Name", "Status", "Version", "Update"];
        const widths = [36, 24, 10, 12, 8];
        const rows = installations.map((i) => [
          i.id,
          i.name ?? "Unknown",
          i.status ?? "-",
          i.installed_version ?? i.catalog_version ?? "-",
          i.update_available ? "Yes" : "No",
        ]);

        console.log("");
        console.log(formatTable(headers, rows, widths));
        console.log("");
        console.log(`Total: ${installations.length} installation(s)`);
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch installations.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  install
    .command("show")
    .description("Show installation details")
    .argument("<installation-id>", "Installation ID (or last 4+ digits of UUID)")
    .action(async (id: string) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const fullId = await resolveInstallationId(id);
        const data = await getInstallation(fullId);
        const i = data.installation;

        console.log("");
        console.log("Installation Details");
        console.log("--------------------");
        console.log(`ID               : ${i.id}`);
        console.log(`Name             : ${i.name ?? "-"}`);
        console.log(`Catalog ID       : ${i.catalog_id}`);
        console.log(`Status           : ${i.status}`);
        console.log(`Version          : ${i.catalog_version ?? "-"}`);
        console.log(`Latest Version   : ${i.latest_published_version ?? "-"}`);
        console.log(`Update Available : ${i.update_available ? "Yes" : "No"}`);
        console.log(`Execution Mode   : ${i.execution_mode ?? "-"}`);
        if (i.activated_at) console.log(`Activated At     : ${i.activated_at}`);
        if (i.deactivated_at) console.log(`Deactivated At   : ${i.deactivated_at}`);
        if (i.created_at) console.log(`Created At       : ${i.created_at}`);
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch installation details.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  install
    .command("activate")
    .description("Activate an installed workflow")
    .argument("<installation-id>", "Installation ID (or last 4+ digits of UUID)")
    .action(async (id: string) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const fullId = await resolveInstallationId(id);
        await activateInstallation(fullId);
        console.log("✅ Installation activated successfully.");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to activate installation.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  install
    .command("deactivate")
    .description("Deactivate an installed workflow")
    .argument("<installation-id>", "Installation ID (or last 4+ digits of UUID)")
    .action(async (id: string) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const fullId = await resolveInstallationId(id);
        await deactivateInstallation(fullId);
        console.log("✅ Installation deactivated successfully.");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to deactivate installation.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  install
    .command("uninstall")
    .description("Uninstall a workflow from your organization")
    .argument("<installation-id>", "Installation ID (or last 4+ digits of UUID)")
    .action(async (id: string) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question("Are you sure you want to uninstall this workflow? (y/N) ", resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
        console.log("Aborted.");
        return;
      }

      try {
        const fullId = await resolveInstallationId(id);
        const result = await uninstallInstallation(fullId);
        console.log(`✅ ${result.message ?? "Workflow uninstalled successfully."}`);
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to uninstall workflow.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });
}
