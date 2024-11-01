import path from "path";
import fsp from "fs/promises";
import fs from "fs";
import { ManamiManager, AnimeOfflineDbEntry } from './manami/index.mjs';
import { QBittorrentManager } from './qbittorrent/qbittorrent.manager.mjs';
import { NyaaManager } from './nyaa/nyaa.manager.mjs';
import winston from "winston";

const MANAMI_CACHE_FILE = "./anime-offline-database.json";
const MANAMI_DOWNLOAD_URL = "https://raw.githubusercontent.com/manami-project/anime-offline-database/master/anime-offline-database-minified.json";
const NYAA_HOST = "https://nyaa.si";
const QB_HOST = "http://localhost:8080"
const QB_USER = "admin"
const QB_PASS = "adminadmin"
    
const logger = winston.createLogger({
    level: "info",
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
});

interface ISearchEntry {
    readonly anidbId: string;
    readonly query: string;
}

const searches: ISearchEntry[] = [];
const _searches: ISearchEntry[] = [
    {
        anidbId: "18289",
        query: "asw ramen akaneko 1080p hevc",
    },
    {
        anidbId: "18098",
        query: "erai suicide squad 1080p hevc",
    },
    {
        anidbId: "17529",
        query: "ember gimai seikatsu 1080p hevc",
    },
    {
        anidbId: "17559",
        query: "ember tower of god 1080p hevc S02",
    },
    {
        anidbId: "18454",
        query: "erai mayonaka punch 1080p hevc",
    },
    {
        anidbId: "18282",
        query: "ember Katsute Mahou Shoujo 1080p hevc",
    },
    {
        anidbId: "17507",
        query: "erai isekai shikkaku 1080p hevc",
    }
];

async function main(): Promise<void> {

    const manamiManger = await ManamiManager.build({
        downloadUrl: MANAMI_DOWNLOAD_URL,
        cacheFilePath: MANAMI_CACHE_FILE,
    });
    logger.info("initialized manami manager");

    const qb = await QBittorrentManager.build({ 
        host: QB_HOST, 
        user: QB_USER, 
        pass: QB_PASS,
    });
    logger.info("initialized qbittorrent manager");

    const nyaaManager = NyaaManager.build({
        host: NYAA_HOST,
        logger: logger.child({ logger: { name: "nyaa" } }),
    });

    const root = "/mnt/f/Weaboo/";
    const hashToAnime: Record<string, AnimeOfflineDbEntry> = {};
    
    for (const search of searches) {
        const anime = await manamiManger.getEntryByAnidbId(search.anidbId).get();
        
        if (!anime) {
            throw new Error(`unknown anidbId: ${search.anidbId}`);
        }

        await fsp.mkdir(path.join(root, anime.folderName), { recursive: true });

        const results = await nyaaManager.getNyaaResults(search.query).get();
        const magnets = results.map((r) => r.magnet);
        await qb.addTorrents(magnets);
        magnets.forEach((magnet) => {
            const xt = new URL(magnet).searchParams.get("xt") ?? "";
            const hash = xt.split(":")[2]
            if (hash) {
                hashToAnime[hash] = anime;
            }
        });
    }

    const loop = async () => {
        for (const torrent of await qb.getTorrents()) {
            const progress = Math.floor(torrent.progress * 100) + "%";
            logger.info([progress, torrent.state, torrent.name].join("\t"));

            const anime = hashToAnime[torrent.hash];
            if (!anime) {
                logger.warn("rogue torrent, no anime found for magnet: ", torrent.magnet_uri, torrent.hash);
            }

            if (anime && torrent.progress === 1) {
                const contents = await qb.getTorrentContents(torrent.hash);
                for (const content of contents) {
                    const src = path.join(root, "downloads", content.name);
                    const dst = path.join(root, anime.folderName, content.name);
                    if (!fs.existsSync(dst)) {
                        logger.info(`\tsrc: ${src}`);
                        logger.info(`\tdst: ${dst}`);
                        await fsp.copyFile(src, dst);
                        logger.info(`\t...done copying`);
                    }
                }
            }
        }

        logger.info("----");
        setTimeout(loop, 10_000);
    };

    setTimeout(loop, 5000);
}

main().catch(logger.error);
