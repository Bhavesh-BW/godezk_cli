export interface WorkflowExecution {
  id: string;
  org_id: string;
  deployment_id: string;
  installation_id?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  duration_ms?: number;
  trigger_event?: string;
  triggered_by?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields from deployment / catalog
  workflow_name?: string;
  workflow_type?: string;
  execution_mode?: string;
  catalog_id?: string;
  catalog_name?: string;
  context?: any;
}


export interface ExecutionStep {
  id: string;
  execution_id: string;
  step_name: string;
  step_type?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error_message?: string;
  step_order?: number;
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  level: string;
  message: string;
  timestamp: string;
  step_name?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionListResponse {
  success: boolean;
  executions: WorkflowExecution[];
}

export interface ExecutionDetailResponse {
  success: boolean;
  execution: WorkflowExecution;
  steps?: ExecutionStep[];
}

export interface ExecutionLogsResponse {
  success: boolean;
  logs: ExecutionLog[];
}

export interface ExecutionCancelResponse {
  success: boolean;
  message: string;
}
