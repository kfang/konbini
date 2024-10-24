export class AnimeOfflineDbEntryNotFound extends Error {
    constructor(public readonly anidbId: string) {
        super("AnimeOfflineDbEntry was not found");
    }
}
