import { Command } from "commander";
import { isAuthenticated, getOrgId } from "../config/config";
import { getWorkflowCatalog, getWorkflowCatalogItem, installWorkflow } from "../api/workflows";

async function resolveWorkflowId(id: string): Promise<string> {
  if (id.length === 36) return id;

  const catalog = await getWorkflowCatalog({ status: "published" });
  const matches = catalog.filter((w) => w.id.endsWith(id));

  if (matches.length === 0) {
    console.error("❌ Workflow ID not found. Run 'gdk workflow list' to see valid IDs.");
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error("❌ Multiple workflows match that ID suffix:");
    console.log("");
    matches.forEach((w) => {
      console.log(`  ${w.id}  —  ${w.name}`);
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

export function registerWorkflowCommands(program: Command): void {
  const workflow = program
    .command("workflow")
    .description("Workflow catalog commands");

  workflow
    .command("list")
    .description("List published workflows in the catalog")
    .option("--category <category>", "Filter by category")
    .action(async (options: { category?: string }) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const params: { status: string; category?: string } = {
          status: "published",
        };
        if (options.category) {
          params.category = options.category;
        }

        const catalog = await getWorkflowCatalog(params);

        if (catalog.length === 0) {
          console.log("No workflows found.");
          return;
        }

        const headers = ["ID", "Name", "Version", "Category", "Mode", "Installs"];
        const widths = [36, 20, 10, 14, 14, 8];
        const rows = catalog.map((w) => [
          w.id,
          w.name,
          w.version ?? "-",
          w.category ?? "-",
          w.execution_mode ?? "-",
          String(w.install_count ?? 0),
        ]);

        console.log("");
        console.log(formatTable(headers, rows, widths));
        console.log("");
        console.log(`Total: ${catalog.length} workflow(s)`);
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch workflow catalog.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  workflow
    .command("show")
    .description("Show workflow catalog details")
    .argument("<workflow-id>", "Workflow catalog ID")
    .action(async (id: string) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const fullId = await resolveWorkflowId(id);
        const data = await getWorkflowCatalogItem(fullId);
        const c = data.catalog;

        console.log("");
        console.log("Workflow Details");
        console.log("----------------");
        console.log(`ID              : ${c.id}`);
        console.log(`Name            : ${c.name}`);
        if (c.description) console.log(`Description     : ${c.description}`);
        console.log(`Category        : ${c.category ?? "-"}`);
        console.log(`Type            : ${c.workflow_type}`);
        console.log(`Execution Mode  : ${c.execution_mode}`);
        console.log(`Version         : ${c.version}`);
        console.log(`Status          : ${c.status}`);
        console.log(`Installs        : ${c.install_count ?? 0}`);
        if (c.trigger_event) console.log(`Trigger Event   : ${c.trigger_event}`);
        if (c.tags && c.tags.length > 0) console.log(`Tags            : ${c.tags.join(", ")}`);

        if (data.params && data.params.length > 0) {
          console.log("");
          console.log("Parameters");
          console.log("----------");
          const pHeaders = ["Key", "Label", "Type", "Required", "Default"];
          const pWidths = [20, 24, 12, 8, 16];
          const pRows = data.params.map((p) => [
            p.param_key,
            p.param_label,
            p.param_type,
            p.required ? "Yes" : "No",
            p.default_value ?? "-",
          ]);
          console.log(formatTable(pHeaders, pRows, pWidths));
        }

        if (data.requirements && data.requirements.length > 0) {
          console.log("");
          console.log("Requirements");
          console.log("------------");
          const rHeaders = ["Key", "Label", "Type"];
          const rWidths = [24, 30, 14];
          const rRows = data.requirements.map((r) => [
            r.requirement_key,
            r.requirement_label,
            r.requirement_type,
          ]);
          console.log(formatTable(rHeaders, rRows, rWidths));
        }

        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch workflow details.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  workflow
    .command("install")
    .description("Install a workflow from the catalog")
    .argument("<workflow-id>", "Workflow catalog ID (or last 4+ digits of UUID)")
    .action(async (id: string) => {
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
        const fullId = await resolveWorkflowId(id);
        const result = await installWorkflow(fullId, orgId);

        console.log("");
        console.log(`✅ Workflow installed successfully.`);
        console.log(`   Installation ID : ${result.installation.id}`);
        console.log(`   Catalog ID      : ${result.installation.catalog_id}`);
        console.log(`   Status          : ${result.installation.status}`);
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to install workflow.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });
}
