import { Command } from "commander";
import { isAuthenticated, getOrgId } from "../config/config";
import { triggerEvent } from "../api/trigger";

export function registerTriggerCommands(program: Command): void {
  program
    .command("trigger")
    .description("Trigger a workflow manual test fire")
    .argument("<event_type>", "Event type (e.g. ppe_violation)")
    .option("--data <json>", "JSON string data payload")
    .option("--org <org>", "Organization ID override")
    .action(async (eventType: string, options: { data?: string; org?: string }) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      const orgId = options.org || getOrgId();
      if (!orgId) {
        console.error("❌ Organization not configured. Run 'gdk auth login' to set your org.");
        process.exit(1);
      }

      let parsedData: Record<string, unknown> = {};
      if (options.data) {
        try {
          parsedData = JSON.parse(options.data);
        } catch (err) {
          console.error("❌ Invalid JSON string provided for --data.");
          process.exit(1);
        }
      }

      try {
        const result = await triggerEvent(eventType, parsedData, orgId);
        console.log(`\n✅ Trigger request processed: triggered ${result.triggered} workflow(s).`);
        
        if (result.results && result.results.length > 0) {
          console.log("\nResults:");
          console.log("--------");
          result.results.forEach((r) => {
            const statusSymbol = r.status === "running" || r.status === "completed" ? "✅" : "❌";
            const detail = r.execution_id ? ` (execution: ${r.execution_id})` : r.error ? ` (error: ${r.error})` : "";
            console.log(`  ${statusSymbol} Installation: ${r.installation_id} — status: ${r.status}${detail}`);
          });
        }
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to trigger event.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });
}
