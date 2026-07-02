export interface WorkflowDeployment {
  id: string;
  org_id: string;
  installation_id: string;
  status: string;
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  target_device?: string;
  schedule?: string;
  activated_at?: string;
  activated_by?: string;
  deactivated_at?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields from installation / catalog
  workflow_name?: string;
  workflow_type?: string;
  execution_mode?: string;
  catalog_id?: string;
  installed_version?: string;
}

export interface DeploymentListResponse {
  success: boolean;
  deployments: WorkflowDeployment[];
}

export interface DeploymentDetailResponse {
  success: boolean;
  deployment: WorkflowDeployment;
}

export interface CreateDeploymentResponse {
  success: boolean;
  deployment: WorkflowDeployment;
}

export interface ActivateDeploymentResponse {
  success: boolean;
  deployment: WorkflowDeployment;
}

export interface DeactivateDeploymentResponse {
  success: boolean;
  deployment: WorkflowDeployment;
}

export interface DeleteDeploymentResponse {
  success: boolean;
  message: string;
}

export interface ControlDeploymentResponse {
  success: boolean;
  action: string;
}

