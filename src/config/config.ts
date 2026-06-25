import Conf from "conf";

export interface CliConfig {

    server?: string;

    token?: string;

    orgId?: string;

    user?: {
        email: string;
        role: string;
    };

}

const config = new Conf<CliConfig>({
    projectName: "godezk"
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

export default config;