export interface WorkflowInstallation {
  id: string;
  org_id: string;
  catalog_id: string;
  catalog_version_id?: string;
  status: string;
  activated_at?: string;
  activated_by?: string;
  deactivated_at?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields from workflow_catalog
  name?: string;
  catalog_name?: string;
  description?: string;
  category?: string;
  workflow_type?: string;
  trigger_event?: string;
  tags?: string[];
  icon?: string;
  execution_mode?: string;

  // Joined version info
  catalog_version?: string;
  installed_version?: string;
  latest_published_version?: string;
  update_available?: boolean;
}

export interface InstallationListResponse {
  success: boolean;
  installations: WorkflowInstallation[];
}

export interface InstallationDetailResponse {
  success: boolean;
  installation: WorkflowInstallation;
  catalog: {
    nodes_definition?: object[];
    edges_definition?: object[];
    version?: string;
  };
}

export interface ActivateInstallationResponse {
  success: boolean;
  installation: WorkflowInstallation;
  execution_mode?: string;
}

export interface DeactivateInstallationResponse {
  success: boolean;
  installation: WorkflowInstallation;
  execution_mode?: string;
}

export interface UninstallInstallationResponse {
  success: boolean;
  message: string;
}
