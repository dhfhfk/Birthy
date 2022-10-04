export interface Config {
    token: string;
    client_id: string;
    mongodb_uri: string;
    languages: string[];
    dev_guilds: string[];
    dev_users: string[];
    support_server_uri: string;
    koreanbots_token: string;
    influx_db: {
        url: string;
        org: string;
        bucket: string;
        token: string;
    };
}
