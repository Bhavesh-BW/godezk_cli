export interface MedOpsUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  org_id: string;
  org_name?: string;
}

export interface LoginResponse {
  token: string;
  user: MedOpsUser;
  allowed_modules?: AllowedModule[];
  allowed_permissions?: AllowedPermission[];
}

export interface AllowedModule {
  module_key: string;
  name: string;
  app: string;
  category: string;
  path: string;
  icon: string;
  display_order: number;
}

export interface AllowedPermission {
  permission_key: string;
  name: string;
  category: string;
  description: string;
}
