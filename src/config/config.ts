import Conf from "conf";
import {
    MedOpsUser,
    AllowedModule,
    AllowedPermission,
} from "../types/auth";

export interface CliConfig {
    server?: string;
    token?: string;
    orgId?: string;
    user?: MedOpsUser;
    modules?: AllowedModule[];
    permissions?: AllowedPermission[];
}

const config = new Conf<CliConfig>({
    projectName: "godezk",
});

// --------------------
// Server Configuration
// --------------------

export function setServer(server: string): void {
    config.set("server", server);
}

export function getServer(): string | undefined {
    return config.get("server");
}

// --------------------
// Token Configuration
// --------------------

export function setToken(token: string): void {
    config.set("token", token);
}

export function getToken(): string | undefined {
    return config.get("token");
}

export function clearToken(): void {
    config.delete("token" as keyof CliConfig);
}

// --------------------
// Organization Configuration
// --------------------

export function setOrgId(orgId: string): void {
    config.set("orgId", orgId);
}

export function getOrgId(): string | undefined {
    return config.get("orgId");
}

// --------------------
// User Configuration
// --------------------

export function setUser(user: MedOpsUser): void {
    config.set("user", user);
}

export function getUser(): MedOpsUser | undefined {
    return config.get("user");
}

// --------------------
// Modules Configuration
// --------------------

export function setModules(modules: AllowedModule[]): void {
    config.set("modules", modules);
}

export function getModules(): AllowedModule[] | undefined {
    return config.get("modules");
}

// --------------------
// Permissions Configuration
// --------------------

export function setPermissions(perms: AllowedPermission[]): void {
    config.set("permissions", perms);
}

export function getPermissions(): AllowedPermission[] | undefined {
    return config.get("permissions");
}

// --------------------
// Session Helpers
// --------------------

export function clearSession(): void {
    config.delete("token" as keyof CliConfig);
    config.delete("user" as keyof CliConfig);
    config.delete("orgId" as keyof CliConfig);
    config.delete("modules" as keyof CliConfig);
    config.delete("permissions" as keyof CliConfig);
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

export default config;