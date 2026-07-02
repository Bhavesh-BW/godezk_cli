import client from "./client";
import {
  DeploymentListResponse,
  DeploymentDetailResponse,
  CreateDeploymentResponse,
  ActivateDeploymentResponse,
  DeactivateDeploymentResponse,
  DeleteDeploymentResponse,
  ControlDeploymentResponse,
} from "../types/deployment";

export async function getDeployments(
  orgId: string
): Promise<DeploymentListResponse> {
  const response = await client.get<DeploymentListResponse>(
    "/api/workflows/deployments",
    { params: { org_id: orgId } }
  );
  return response.data;
}

export async function getDeployment(
  id: string
): Promise<DeploymentDetailResponse> {
  const response = await client.get<DeploymentDetailResponse>(
    `/api/workflows/deployments/${id}`
  );
  return response.data;
}

export async function createDeployment(
  installationId: string,
  orgId: string,
  config?: Record<string, unknown>
): Promise<CreateDeploymentResponse> {
  const response = await client.post<CreateDeploymentResponse>(
    "/api/workflows/deployments",
    {
      installation_id: installationId,
      org_id: orgId,
      config: config ?? {},
    }
  );
  return response.data;
}

export async function activateDeployment(
  id: string
): Promise<ControlDeploymentResponse> {
  return controlDeployment(id, "resume");
}

export async function deactivateDeployment(
  id: string
): Promise<ControlDeploymentResponse> {
  return controlDeployment(id, "pause");
}


export async function deleteDeployment(
  id: string
): Promise<DeleteDeploymentResponse> {
  const response = await client.delete<DeleteDeploymentResponse>(
    `/api/workflows/deployments/${id}`
  );
  return response.data;
}

export async function controlDeployment(
  id: string,
  action: "stop" | "pause" | "resume"
): Promise<ControlDeploymentResponse> {
  const response = await client.post<ControlDeploymentResponse>(
    `/api/workflows/deployments/${id}/control`,
    { action }
  );
  return response.data;
}

