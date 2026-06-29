import client from "./client";
import {
  InstallationListResponse,
  InstallationDetailResponse,
  ActivateInstallationResponse,
  DeactivateInstallationResponse,
  UninstallInstallationResponse,
} from "../types/installation";

export async function getInstallations(
  orgId: string
): Promise<InstallationListResponse> {
  const response = await client.get<InstallationListResponse>(
    "/api/workflows/installations",
    { params: { org_id: orgId } }
  );
  return response.data;
}

export async function getInstallation(
  id: string
): Promise<InstallationDetailResponse> {
  const response = await client.get<InstallationDetailResponse>(
    `/api/workflows/installations/${id}`
  );
  return response.data;
}

export async function activateInstallation(
  id: string
): Promise<ActivateInstallationResponse> {
  const response = await client.post<ActivateInstallationResponse>(
    `/api/workflows/installations/${id}/activate`
  );
  return response.data;
}

export async function deactivateInstallation(
  id: string
): Promise<DeactivateInstallationResponse> {
  const response = await client.post<DeactivateInstallationResponse>(
    `/api/workflows/installations/${id}/deactivate`
  );
  return response.data;
}

export async function uninstallInstallation(
  id: string
): Promise<UninstallInstallationResponse> {
  const response = await client.delete<UninstallInstallationResponse>(
    `/api/workflows/installations/${id}`
  );
  return response.data;
}
