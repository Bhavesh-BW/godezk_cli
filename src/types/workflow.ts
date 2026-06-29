export interface CatalogParam {
  id: string;
  catalog_id: string;
  param_key: string;
  param_label: string;
  param_type: string;
  default_value?: string | null;
  required: boolean;
  display_order: number;
}

export interface CatalogRequirement {
  id: string;
  catalog_id: string;
  requirement_key: string;
  requirement_label: string;
  requirement_type: string;
  display_order: number;
}

export interface WorkflowCatalogItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  workflow_type: string;
  trigger_event?: string;
  version: string;
  status: string;
  execution_mode: string;
  tags?: string[];
  icon?: string;
  install_count: number;
  is_installed?: boolean;
  installation_id?: string | null;
  installed_version?: string | null;
  update_available?: boolean;
  published_at?: string;
  updated_at?: string;
}

export interface WorkflowCatalogDetail extends WorkflowCatalogItem {
  nodes_definition?: object[];
  edges_definition?: object[];
}

export interface CatalogListResponse {
  success: boolean;
  catalog: WorkflowCatalogItem[];
}

export interface CatalogDetailResponse {
  success: boolean;
  catalog: WorkflowCatalogDetail;
  params: CatalogParam[];
  requirements: CatalogRequirement[];
}

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
}

export interface InstallWorkflowResponse {
  success: boolean;
  installation: WorkflowInstallation;
}
