import client from "./client";
import {
  CatalogListResponse,
  CatalogDetailResponse,
  WorkflowCatalogItem,
  InstallWorkflowResponse,
  RequirementsCheckResponse,
  InstallationConfigResponse,
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

export async function getRequirementsCheck(
  catalogId: string,
  orgId: string
): Promise<RequirementsCheckResponse> {
  const response = await client.get<RequirementsCheckResponse>(
    `/api/workflows/catalog/${catalogId}/requirements-check`,
    { params: { org_id: orgId } }
  );
  return response.data;
}

export async function getInstallationConfig(
  installationId: string
): Promise<InstallationConfigResponse> {
  const response = await client.get<InstallationConfigResponse>(
    `/api/workflows/installations/${installationId}/config`
  );
  return response.data;
}

export async function updateInstallationConfig(
  installationId: string,
  configs: Record<string, unknown>
): Promise<{ success: boolean }> {
  const response = await client.put<{ success: boolean }>(
    `/api/workflows/installations/${installationId}/config`,
    { configs }
  );
  return response.data;
}

