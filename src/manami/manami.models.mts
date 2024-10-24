export interface IAnimeOfflineDbEntry {
    readonly animeSeason: {
        readonly season: "SPRING" | "SUMMER" | "FALL" | "WINTER" | "UNDEFINED";
        readonly year?: number;
    };
    readonly episodes: number;
    readonly picture: string;
    readonly relatedAnime: string[];
    readonly sources: string[];
    readonly status: "FINISHED" | "ONGOING" | "UPCOMING" | "UNKNOWN";
    readonly synonyms: string[];
    readonly tags: string[];
    readonly thumbnail: string;
    readonly title: string;
    readonly type: "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL" | "UNKNOWN";
}

export interface IAnimeOfflineDb {
    readonly lastUpdate: string;
    readonly data: IAnimeOfflineDbEntry[];
}

export class AnimeOfflineDbEntry {

    private readonly sources: URL[];
    constructor(private readonly data: IAnimeOfflineDbEntry) {
        this.sources = data.sources.map((source) => new URL(source));
    }

    get title(): string {
        const replaced = this.data.title.replaceAll(/[^A-Za-z0-9-_\(\)\[\]!\s]/g, "");

        if (replaced === "") {
            throw new Error(`failed to normalize title: ${this.data.title}`);
        }

        return replaced;
    }

    get anidbId(): string | undefined {
        return this.sources
            .find((source) => source.host === "anidb.net")
            ?.pathname.split("/")[2];
    }

    get folderName(): string {
        return `${this.title} [anidb3-${this.anidbId}]`;
    }
}
