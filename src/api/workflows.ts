import client from "./client";
import {
  CatalogListResponse,
  CatalogDetailResponse,
  WorkflowCatalogItem,
  InstallWorkflowResponse,
} from "../types/workflow";

export async function getWorkflowCatalog(params?: {
  status?: string;
  category?: string;
}): Promise<WorkflowCatalogItem[]> {
  const response = await client.get<CatalogListResponse>("/api/workflows/catalog", {
    params,
  });
  return response.data.catalog ?? [];
}

export async function getWorkflowCatalogItem(
  id: string
): Promise<CatalogDetailResponse> {
  const response = await client.get<CatalogDetailResponse>(`/api/workflows/catalog/${id}`);
  return response.data;
}

export async function installWorkflow(
  catalogId: string,
  orgId: string,
  configs?: Record<string, unknown>
): Promise<InstallWorkflowResponse> {
  const response = await client.post<InstallWorkflowResponse>(
    `/api/workflows/catalog/${catalogId}/install`,
    { org_id: orgId, configs: configs ?? {} }
  );
  return response.data;
}
