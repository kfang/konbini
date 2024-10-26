import axios, { AxiosInstance } from "axios";
import { ITorrentContent, ITorrentInfo } from "./qbittorrent.models.mjs";

export interface IQBittorrentManagerOpts {
    readonly host: string;
    readonly user: string;
    readonly pass: string;
}

export class QBittorrentManager {

    public static async build(opts: IQBittorrentManagerOpts): Promise<QBittorrentManager> {
        const data = new URLSearchParams({ username: opts.user, password: opts.pass });
        const res = await axios.post(`${opts.host}/api/v2/auth/login`, data);
        const cookies = res.headers["set-cookie"] ?? [];
        const cookie = cookies.find((c) => c.startsWith("SID="));

        const client = axios.create({
            baseURL: opts.host,
            headers: { Cookie: cookie }
        });

        return new QBittorrentManager(client);
    }

    constructor(private readonly client: AxiosInstance) {}

    public async addTorrents(urls: string[]): Promise<void> {
        const form = new FormData();
        form.append("urls", urls.join("\n"));
        form.append("skip_checking", false);

        await this.client.postForm("/api/v2/torrents/add", form);
    }

    public async getTorrents(sort: string = "name"): Promise<ITorrentInfo[]> {
        const res = await this.client.get<ITorrentInfo[]>("/api/v2/torrents/info", { params: { sort } });
        return res.data;
    }

    public async getTorrentContents(hash: string): Promise<ITorrentContent[]> {
        const res = await this.client.get<ITorrentContent[]>("/api/v2/torrents/files", { params: { hash }});
        return res.data;
    }
}
