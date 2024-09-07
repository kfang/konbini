import axios, { AxiosInstance } from "axios";

export interface ITorrentInfo {
    /** time (unix epoch) when the torrent was added to the client */
    readonly added_on: number;

    /** amount of data left to download (bytes) */
    readonly amount_left: number;

    /** whether this torrent is managed by Automatic Torrent Management */
    readonly auto_tmm: boolean;

    /** percentage of file pieces currently available */
    readonly availability: number;

    /** category of the torrent. empty string if no category */
    readonly category: string;

    /** amount of transfer data completed (bytes) */
    readonly completed: number;

    /** time (unix epoch) when the torrent completed */
    readonly completion_on: number;

    /** absolute path of torrent content (root path for multifile torrents, absolute file path for singlefile torrents) */
    readonly content_path: string;

    /** torrent hash */
    readonly hash: string;

    /** magnet uri corresponding to this torrent */
    readonly magnet_uri: string;

    /** torrent name */
    readonly name: string;

    /** torrent progress (precentage/100) */
    readonly progress: number;

    /** torrent share ratio. max ratio value: 9999 */
    readonly ratio: number;

    /** torrent state */
    readonly state: string;
}

export interface ITorrentContent {
    readonly name: string;
    readonly progress: number;
}

export class QBitorrentManager {

    public static async build(host: string, username: string, password: string): Promise<QBitorrentManager> {
        const data = new URLSearchParams({ username, password });
        const res = await axios.post(`${host}/api/v2/auth/login`, data);
        const cookies = res.headers["set-cookie"] ?? [];
        const cookie = cookies.find((c) => c.startsWith("SID="));

        const client = axios.create({
            baseURL: host,
            headers: { Cookie: cookie }
        });

        return new QBitorrentManager(client);
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
