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

