import client from "./client";
import {
  ExecutionListResponse,
  ExecutionDetailResponse,
  ExecutionLogsResponse,
  ExecutionCancelResponse,
} from "../types/execution";

export async function getExecutions(
  orgId: string,
  params?: {
    deployment_id?: string;
    status?: string;
    limit?: number;
  }
): Promise<ExecutionListResponse> {
  const response = await client.get<ExecutionListResponse>(
    "/api/workflows/executions",
    { params: { org_id: orgId, ...params } }
  );
  return response.data;
}

export async function getExecution(
  id: string
): Promise<ExecutionDetailResponse> {
  const response = await client.get<ExecutionDetailResponse>(
    `/api/workflows/executions/${id}`
  );
  return response.data;
}

export async function getExecutionLogs(
  id: string
): Promise<ExecutionLogsResponse> {
  const response = await client.get<ExecutionLogsResponse>(
    `/api/workflows/executions/${id}/logs`
  );
  return response.data;
}

export async function cancelExecution(
  id: string
): Promise<ExecutionCancelResponse> {
  const response = await client.post<ExecutionCancelResponse>(
    `/api/workflows/executions/${id}/cancel`
  );
  return response.data;
}
