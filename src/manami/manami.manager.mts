import axios from "axios";
import fs from "fs/promises";
import { AnimeOfflineDbEntry, IAnimeOfflineDb } from "./manami.models.mjs";
import {TryAsync} from "@kfang/typescript-fp";
import { AnimeOfflineDbEntryNotFound } from "./manami.errors.mjs";

export interface IManamiMangerOpts {
    downloadUrl: string;
    cacheFilePath: string;
}

// TODO: This should go into a SQLite db
export class ManamiManager {

    public static async build(opts: IManamiMangerOpts): Promise<ManamiManager> {
        const readFromCache = () => TryAsync
            .of(fs.readFile(opts.cacheFilePath))
            .map((buff) => JSON.parse(buff.toString()));

        const readFromDownloadUrl = () => TryAsync
            .of(axios.get<IAnimeOfflineDb>(opts.downloadUrl))
            .map((res) => res.data);

        const writeToCache = async (animeOfflineDb: IAnimeOfflineDb) => {
            await fs.writeFile(opts.cacheFilePath, JSON.stringify(animeOfflineDb));
            return animeOfflineDb;
        }

        return readFromCache()
            .recoverWith(readFromDownloadUrl)
            .mapAsync(writeToCache)
            .map((db) => new ManamiManager(db))
            .get();
    }

    private readonly entries: Record<string, AnimeOfflineDbEntry>;
    
    private constructor(db: IAnimeOfflineDb) {
        this.entries = {};
        for (const entry of db.data) {
            const value = new AnimeOfflineDbEntry(entry);
            const key = value.anidbId;
            if (key) {
                this.entries[key] = value;
            }
        }

        this.getEntryByAnidbId = this.getEntryByAnidbId.bind(this);
    }

    public getEntryByAnidbId(anidbId: string): TryAsync<AnimeOfflineDbEntry> {
        const entry = this.entries[anidbId];
        return entry ? TryAsync.success(entry) : TryAsync.failure(new AnimeOfflineDbEntryNotFound(anidbId));
    }
}
