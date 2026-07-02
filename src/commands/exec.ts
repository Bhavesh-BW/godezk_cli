import { Command } from "commander";
import { isAuthenticated, getOrgId } from "../config/config";
import {
  getExecutions,
  getExecution,
  getExecutionLogs,
  cancelExecution,
} from "../api/executions";
import { getWorkflowCatalog } from "../api/workflows";
import client from "../api/client";
import { WorkflowExecution, ExecutionStep } from "../types/execution";

async function resolveExecutionId(id: string): Promise<string> {
  if (id.length === 36) return id;

  const orgId = getOrgId();
  if (!orgId) {
    console.error("❌ Organization not configured. Run 'gdk auth login' to set your org.");
    process.exit(1);
  }

  const data = await getExecutions(orgId);
  const executions = data.executions ?? [];
  const matches = executions.filter((e) => e.id.endsWith(id));

  if (matches.length === 0) {
    console.error("❌ Execution ID not found. Run 'gdk exec list' to see valid IDs.");
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error("❌ Multiple executions match that ID suffix:");
    console.log("");
    matches.forEach((e) => {
      console.log(`  ${e.id}  —  ${e.workflow_name ?? "Unknown"}  (${e.status})`);
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

function formatDuration(ms?: number): string {
  if (!ms && ms !== 0) return "-";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function statusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case "running":
    case "in_progress":
      return "🔄";
    case "completed":
    case "success":
      return "✅";
    case "failed":
    case "error":
      return "❌";
    case "cancelled":
    case "canceled":
      return "🚫";
    case "pending":
    case "queued":
      return "⏳";
    default:
      return "⚪";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function registerExecCommands(program: Command): void {
  const exec = program
    .command("exec")
    .description("Monitor workflow executions");

  // ──────────────────────────────────────────
  // exec list
  // ──────────────────────────────────────────
  exec
    .command("list")
    .description("List recent workflow executions")
    .option("--deployment <id>", "Filter by deployment ID")
    .option("--status <status>", "Filter by status (running, completed, failed)")
    .option("--limit <n>", "Limit number of results", "20")
    .option("--json", "Output raw JSON data")
    .option("--quiet", "Only display IDs")
    .action(async (options: { deployment?: string; status?: string; limit?: string; json?: boolean; quiet?: boolean }) => {
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
        const params: { deployment_id?: string; status?: string; limit?: number } = {};
        if (options.deployment) params.deployment_id = options.deployment;
        if (options.status) params.status = options.status;
        if (options.limit) params.limit = parseInt(options.limit, 10);

        const data = await getExecutions(orgId, params);
        const executions = data.executions ?? [];

        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }

        if (options.quiet) {
          executions.forEach((e) => console.log(e.id));
          return;
        }

        if (executions.length === 0) {
          console.log("No executions found.");
          return;
        }

        const headers = ["ID", "Workflow", "Status", "Duration", "Started At"];
        const widths = [36, 22, 12, 10, 22];
        const rows = executions.map((e) => [
          e.id,
          e.workflow_name ?? e.catalog_name ?? "Unknown",
          `${statusIcon(e.status)} ${e.status}`,
          formatDuration(e.duration_ms),
          e.started_at ?? e.created_at ?? "-",
        ]);

        console.log("");
        console.log(formatTable(headers, rows, widths));
        console.log("");
        console.log(`Total: ${executions.length} execution(s)`);
        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch executions.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // exec show
  // ──────────────────────────────────────────
  exec
    .command("show")
    .description("Show execution details and steps")
    .argument("<execution-id>", "Execution ID (or last 4+ digits of UUID)")
    .option("--json", "Output raw JSON data")
    .option("--quiet", "Only display IDs")
    .action(async (id: string, options: { json?: boolean; quiet?: boolean }) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      try {
        const fullId = await resolveExecutionId(id);

        if (options.quiet) {
          console.log(fullId);
          return;
        }

        const data = await getExecution(fullId);

        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }

        const e = data.execution;

        const deviceId = e.context?.device_id ?? e.context?.device?.id ?? e.context?.event?.device_id;
        const deviceName = e.context?.device?.name ?? e.context?.event?.device_name;

        console.log("");
        console.log("Execution Details");
        console.log("-----------------");
        console.log(`ID               : ${e.id}`);
        console.log(`Workflow         : ${e.workflow_name ?? e.catalog_name ?? "-"}`);
        console.log(`Status           : ${statusIcon(e.status)} ${e.status}`);
        console.log(`Execution Mode   : ${e.execution_mode ?? "-"}`);
        if (deviceId) {
          console.log(`Device ID        : ${deviceId}`);
        }
        if (deviceName) {
          console.log(`Device Name      : ${deviceName}`);
        }
        console.log(`Duration         : ${formatDuration(e.duration_ms)}`);
        if (e.trigger_event) console.log(`Trigger          : ${e.trigger_event}`);
        if (e.triggered_by) console.log(`Triggered By     : ${e.triggered_by}`);
        if (e.started_at) console.log(`Started At       : ${e.started_at}`);
        if (e.completed_at) console.log(`Completed At     : ${e.completed_at}`);
        if (e.failed_at) console.log(`Failed At        : ${e.failed_at}`);
        if (e.error_message) console.log(`Error            : ${e.error_message}`);

        // Show steps if available
        if (data.steps && data.steps.length > 0) {
          console.log("");
          console.log("Steps");
          console.log("-----");
          const sHeaders = ["#", "Step", "Status", "Duration"];
          const sWidths = [4, 28, 12, 10];
          const sRows = data.steps.map((s) => [
            String(s.step_order ?? "-"),
            s.step_name,
            `${statusIcon(s.status)} ${s.status}`,
            formatDuration(s.duration_ms),
          ]);
          console.log(formatTable(sHeaders, sRows, sWidths));
        }

        console.log("");
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch execution details.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // exec logs
  // ──────────────────────────────────────────
  exec
    .command("logs")
    .description("View live pipeline timing logs")
    .argument("[execution-id]", "Optional Execution ID to filter logs")
    .option("--org <org>", "Organization ID override")
    .action(async (id: string | undefined, options: { org?: string }) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      const orgId = options.org || getOrgId();
      if (!orgId) {
        console.error("❌ Organization not configured. Run 'gdk auth login' to set your org.");
        process.exit(1);
      }

      let targetExecutionId = "";
      if (id) {
        try {
          targetExecutionId = await resolveExecutionId(id);
          console.log(`\n📡 Tailing pipeline logs for execution: ${targetExecutionId}... (Ctrl+C to stop)\n`);
        } catch (err) {
          process.exit(1);
        }
      } else {
        console.log(`\n📡 Tailing live pipeline events for org: ${orgId}... (Ctrl+C to stop)\n`);
      }

      try {
        const response = await client.get(`/api/workflows/pipeline/stream?org_id=${orgId}`, {
          responseType: "stream",
        });

        const stream = response.data as any;
        let buffer = "";

        stream.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                const ev = JSON.parse(jsonStr);

                // Filter by execution_id if target is set
                if (targetExecutionId && ev.execution_id !== targetExecutionId) {
                  continue;
                }

                const time = ev.ts ? new Date(ev.ts).toLocaleTimeString() : new Date().toLocaleTimeString();
                const stage = String(ev.stage || "").padEnd(16);
                
                const parts = [];
                if (ev.device_id) parts.push(`dev=${String(ev.device_id).slice(0, 8)}`);
                if (ev.event_type) parts.push(`type=${ev.event_type}`);
                if (ev.duration_ms !== undefined && ev.duration_ms !== null) parts.push(`${ev.duration_ms}ms`);
                if (ev.detected_count !== undefined && ev.detected_count !== null) parts.push(`detected=${ev.detected_count}`);
                if (ev.detail) parts.push(ev.detail);
                if (ev.execution_id && !targetExecutionId) parts.push(`exec=${ev.execution_id.slice(-8)}`);

                console.log(`[${time}] [TIMING] ${stage} ${parts.join(" ")}`);
              } catch (_) {}
            }
          }
        });

        stream.on("error", (err: any) => {
          console.error(`❌ Stream connection error: ${err.message}`);
          process.exit(1);
        });

      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to connect to pipeline stream.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });


  // ──────────────────────────────────────────
  // exec watch
  // ──────────────────────────────────────────
  exec
    .command("watch")
    .description("Watch running executions (real-time stream or specific ID polling)")
    .argument("[execution-id]", "Optional Execution ID to watch a specific run via polling")
    .option("--org <org>", "Organization ID for live SSE tail")
    .option("--interval <seconds>", "Polling interval in seconds for specific watch", "3")
    .action(async (id: string | undefined, options: { org?: string; interval?: string }) => {
      if (!isAuthenticated()) {
        console.log("❌ Not logged in. Run: gdk auth login");
        return;
      }

      // Scenario A: Watch specific execution by polling
      if (id) {
        const intervalMs = (parseInt(options.interval ?? "3", 10) || 3) * 1000;

        try {
          const fullId = await resolveExecutionId(id);

          console.log("");
          console.log(`👁️  Watching execution ${fullId.slice(-8)}... (Ctrl+C to stop)`);
          console.log("");

          let lastStatus = "";
          let lastStepCount = 0;

          while (true) {
            try {
              const data = await getExecution(fullId);
              const e = data.execution;

              if (e.status !== lastStatus) {
                console.log(`${statusIcon(e.status)} Status: ${e.status}  |  Duration: ${formatDuration(e.duration_ms)}`);
                lastStatus = e.status;
              }

              if (data.steps && data.steps.length > lastStepCount) {
                const newSteps = data.steps.slice(lastStepCount);
                newSteps.forEach((s) => {
                  console.log(`   ${statusIcon(s.status)} Step ${s.step_order ?? "?"}: ${s.step_name} — ${s.status} (${formatDuration(s.duration_ms)})`);
                });
                lastStepCount = data.steps.length;
              }

              const terminalStatuses = ["completed", "success", "failed", "error", "cancelled", "canceled"];
              if (terminalStatuses.includes(e.status.toLowerCase())) {
                console.log("");
                console.log(`${statusIcon(e.status)} Execution finished: ${e.status}`);
                if (e.duration_ms) {
                  console.log(`   Total duration: ${formatDuration(e.duration_ms)}`);
                }
                if (e.error_message) {
                  console.log(`   Error: ${e.error_message}`);
                }
                console.log("");
                break;
              }

              await sleep(intervalMs);
            } catch (pollErr: any) {
              console.error(`   ⚠️  Poll error: ${pollErr?.message ?? "Unknown error"}`);
              await sleep(intervalMs);
            }
          }
        } catch (err: any) {
          const message =
            err?.response?.data?.error ||
            err?.message ||
            "Failed to watch execution.";
          console.error(`❌ ${message}`);
          process.exit(1);
        }
        return;
      }

      // Scenario B: Live SSE Stream for all organization executions
      const orgId = options.org || getOrgId();
      if (!orgId) {
        console.error("❌ Organization not configured. Run 'gdk auth login' to set your org.");
        process.exit(1);
      }

      console.log(`\n📡 Watching live executions stream for org: ${orgId}... (Ctrl+C to stop)\n`);

      // Resolve catalog names to show workflow names instead of UUIDs in streaming
      const catalogNames = new Map<string, string>();
      try {
        const catalog = await getWorkflowCatalog({ status: "published" });
        catalog.forEach((w) => catalogNames.set(w.id, w.name));
      } catch (_) {}

      try {
        const response = await client.get(`/api/workflows/executions/stream?org_id=${orgId}`, {
          responseType: "stream",
        });

        const stream = response.data as any;
        let buffer = "";


        stream.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                const event = JSON.parse(jsonStr);

                const time = event.started_at 
                  ? new Date(event.started_at).toLocaleTimeString() 
                  : new Date().toLocaleTimeString();

                const workflowName = catalogNames.get(event.catalog_id) || `Workflow (${event.catalog_id.slice(-8)})`;
                const seq = event.seq_no ? `#${String(event.seq_no).padStart(6, '0')}` : "------";
                const shortId = event.id ? event.id.split('-')[0].slice(0, 7) : "";
                const identifier = shortId ? `${seq}-${shortId}` : seq;

                const durationStr = event.duration_ms !== null && event.duration_ms !== undefined
                  ? ` (${formatDuration(event.duration_ms)})`
                  : "";

                console.log(`[${time}] ${identifier}  ${workflowName.padEnd(28)}  ${statusIcon(event.status)} ${event.status.padEnd(10)}${durationStr}`);
              } catch (_) {}
            }
          }
        });

        stream.on("error", (err: any) => {
          console.error(`❌ SSE stream connection error: ${err.message}`);
          process.exit(1);
        });

      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to connect to executions SSE stream.";
        console.error(`❌ ${message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────
  // exec cancel
  // ──────────────────────────────────────────
  exec
    .command("cancel")
    .description("Cancel a running execution")
    .argument("<execution-id>", "Execution ID (or last 4+ digits of UUID)")
    .action(async (id: string) => {
      console.log("\n❌ Backend cancel endpoint is not supported in this version.");
      console.log("   Executions cannot be cancelled from the CLI.\n");
    });
}
