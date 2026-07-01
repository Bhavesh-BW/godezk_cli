import { Command } from "commander";
import { isAuthenticated, getOrgId } from "../config/config";
import {
  getDeployments,
  getDeployment,
  createDeployment,
  activateDeployment,
  deactivateDeployment,
  deleteDeployment,
  controlDeployment,
} from "../api/deployments";
import { WorkflowDeployment } from "../types/deployment";

async function resolveDeploymentId(id: string): Promise<string> {
  if (id.length === 36) return id;

  const orgId = getOrgId();
  if (!orgId) {
    console.error("❌ Organization not configured. Run 'gdk auth login' to set your org.");
    process.exit(1);
  }

  const data = await getDeployments(orgId);
  const deployments = data.deployments ?? [];
  const matches = deployments.filter((d) => d.id.endsWith(id));

  if (matches.length === 0) {
    console.error("❌ Deployment ID not found. Run 'gdk deploy list' to see valid IDs.");
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error("❌ Multiple deployments match that ID suffix:");
    console.log("");
    matches.forEach((d) => {
      console.log(`  ${d.id}  —  ${d.workflow_name ?? d.name ?? "Unknown"}`);
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

export function registerDeploymentCommands(program: Command): void {
  const deploy = program
    .command("deploy")
    .description("Manage workflow deployments");

  // ──────────────────────────────────────────
  // deploy list
  // ──────────────────────────────────────────
  deploy
    .command("list")
    .description("List deployments for your organization")
    .option("--json", "Output raw JSON data")
    .option("--quiet", "Only display IDs")
    .action(async (options: { json?: boolean; quiet?: boolean }) => {
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
        const data = await getDeployments(orgId);
        const deployments = data.deployments ?? [];

        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }

        if (options.quiet) {
          deployments.forEach((d) => console.log(d.id));
          return;
        }

        if (deployments.length === 0) {
          console.log("No deployments found.");
          return;
        }

        const headers = ["ID", "Workflow", "Status", "Version", "Created At"];
        const widths = [36, 24, 10, 12, 20];
        const rows = deployments.map((d) => [
          d.id,
          d.workflow_name ?? d.name ?? "Unknown",
          d.status ?? "-",
          d.installed_version ?? "-",
          d.created_at ?? "-",
        ]);

        console.log("");
        console.log(formatTable(headers, rows, widths));
        console.log("");
        console.log(`Total: ${deployments.length} deployment(s)`);
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch deployments.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // deploy show
  // ──────────────────────────────────────────
  deploy
    .command("show")
    .description("Show deployment details")
    .argument("<deployment-id>", "Deployment ID (or last 4+ digits of UUID)")
    .option("--json", "Output raw JSON data")
    .option("--quiet", "Only display IDs")
    .action(async (id: string, options: { json?: boolean; quiet?: boolean }) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const fullId = await resolveDeploymentId(id);

        if (options.quiet) {
          console.log(fullId);
          return;
        }

        const data = await getDeployment(fullId);

        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }

        const d = data.deployment;

        console.log("");
        console.log("Deployment Details");
        console.log("------------------");
        console.log(`ID               : ${d.id}`);
        console.log(`Workflow         : ${d.workflow_name ?? d.name ?? "-"}`);
        console.log(`Installation ID  : ${d.installation_id}`);
        console.log(`Status           : ${d.status}`);
        console.log(`Execution Mode   : ${d.execution_mode ?? "-"}`);
        console.log(`Version          : ${d.installed_version ?? "-"}`);
        if (d.target_device) console.log(`Target Device    : ${d.target_device}`);
        if (d.schedule) console.log(`Schedule         : ${d.schedule}`);
        if (d.activated_at) console.log(`Activated At     : ${d.activated_at}`);
        if (d.deactivated_at) console.log(`Deactivated At   : ${d.deactivated_at}`);
        if (d.created_at) console.log(`Created At       : ${d.created_at}`);
        if (d.updated_at) console.log(`Updated At       : ${d.updated_at}`);
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch deployment details.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // deploy create
  // ──────────────────────────────────────────
  deploy
    .command("create")
    .description("Create a deployment from an installed workflow")
    .argument("<installation-id>", "Installation ID (or last 4+ digits of UUID)")
    .action(async (installationId: string) => {
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
        let fullInstallationId = installationId;
        if (installationId.length !== 36) {
          const { getInstallations } = await import("../api/installations.js");
          const instData = await getInstallations(orgId);
          const installations = instData.installations ?? [];
          const matches = installations.filter((i: { id: string; name?: string }) => i.id.endsWith(installationId));

          if (matches.length === 0) {
            console.error("❌ Installation ID not found. Run 'gdk install list' to see valid IDs.");
            process.exit(1);
          }
          if (matches.length > 1) {
            console.error("❌ Multiple installations match that ID suffix:");
            console.log("");
            matches.forEach((i: { id: string; name?: string }) => {
              console.log(`  ${i.id}  —  ${i.name ?? "Unknown"}`);
            });
            console.log("");
            console.error("Please use more characters to disambiguate.");
            process.exit(1);
          }
          fullInstallationId = matches[0].id;
        }

        const result = await createDeployment(fullInstallationId, orgId);

        console.log("");
        console.log("✅ Deployment created successfully.");
        console.log(`   Deployment ID    : ${result.deployment.id}`);
        console.log(`   Installation ID  : ${result.deployment.installation_id}`);
        console.log(`   Status           : ${result.deployment.status}`);
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to create deployment.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // deploy activate
  // ──────────────────────────────────────────
  deploy
    .command("activate")
    .description("Activate a deployment")
    .argument("<deployment-id>", "Deployment ID (or last 4+ digits of UUID)")
    .action(async (id: string) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const fullId = await resolveDeploymentId(id);
        await activateDeployment(fullId);
        console.log("✅ Deployment activated successfully.");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to activate deployment.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // deploy deactivate
  // ──────────────────────────────────────────
  deploy
    .command("deactivate")
    .description("Deactivate a deployment")
    .argument("<deployment-id>", "Deployment ID (or last 4+ digits of UUID)")
    .action(async (id: string) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const fullId = await resolveDeploymentId(id);
        await deactivateDeployment(fullId);
        console.log("✅ Deployment deactivated successfully.");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to deactivate deployment.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // deploy control
  // ──────────────────────────────────────────
  deploy
    .command("control")
    .description("Control deployment status (stop|pause|resume)")
    .argument("<deployment-id>", "Deployment ID (or last 4+ digits of UUID)")
    .argument("<action>", "Action to perform (stop|pause|resume)")
    .action(async (id: string, action: string) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      const validActions = ["stop", "pause", "resume"];
      if (!validActions.includes(action.toLowerCase())) {
        console.error("❌ Action must be stop | pause | resume");
        process.exit(1);
      }

      try {
        const fullId = await resolveDeploymentId(id);
        const result = await controlDeployment(fullId, action.toLowerCase() as "stop" | "pause" | "resume");
        console.log(`✅ Deployment control command '${result.action}' sent successfully.`);
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to control deployment.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // deploy delete
  // ──────────────────────────────────────────
  deploy
    .command("delete")
    .description("Delete a deployment")
    .argument("<deployment-id>", "Deployment ID (or last 4+ digits of UUID)")
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
        rl.question("Are you sure you want to delete this deployment? (y/N) ", resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
        console.log("Aborted.");
        return;
      }

      try {
        const fullId = await resolveDeploymentId(id);
        const result = await deleteDeployment(fullId);
        console.log(`✅ ${result.message ?? "Deployment deleted successfully."}`);
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to delete deployment.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });
}
