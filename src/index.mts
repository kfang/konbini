import axios from 'axios';
import nodeHtmlParser from 'node-html-parser';
import path from "path";
import fsp from "fs/promises";
import fs from "fs";
import { QBitorrentManager } from './qbitorrent.mjs';
import { ManamiManager } from './manami/manami.manager.mjs';
import { AnimeOfflineDbEntry } from './manami/manami.models.mjs';

const MANAMI_CACHE_FILE = "./anime-offline-database.json";
const MANAMI_DOWNLOAD_URL = "https://raw.githubusercontent.com/manami-project/anime-offline-database/master/anime-offline-database-minified.json";

interface ISearchEntry {
    readonly anidbId: string;
    readonly query: string;
}

const searches: ISearchEntry[] = [
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

async function getNyaaResults(query: string): Promise<string[]> {
    const results: string[] = [];

    try {
        const params = { c: "1_2", f: "0", q: query };
        const res = await axios.get("https://nyaa.si/", { params });

        const doc = nodeHtmlParser.parse(res.data);
        const x = doc.querySelectorAll("table.torrent-list tbody tr")
        
        for (const row of x) {
            const cells = row.getElementsByTagName("td");
            
            const name = cells[1]
                .getElementsByTagName("a")
                .filter((e) => e.getAttribute("class") !== "comments")[0]
                .getAttribute("title");
            
            const [_, magnet] = cells[2].getElementsByTagName("a");

            const magLink = magnet.getAttribute("href");
            
            if (magLink) {
                results.push(magLink);
            }
        }
    } catch (e) {
        console.error(e);
    }

    return results;
}

async function main(): Promise<void> {
    const manamiManger = await ManamiManager.build({
        downloadUrl: MANAMI_DOWNLOAD_URL,
        cacheFilePath: MANAMI_CACHE_FILE,
    });
    console.log("initialized manami manager");

    const qb = await QBitorrentManager.build("http://localhost:8080", "admin", "adminadmin");
    console.log("initialized qbittorrent manager");

    const root = "/mnt/f/Weaboo/";

    const hashToAnime: Record<string, AnimeOfflineDbEntry> = {};
    
    for (const search of searches) {
        const anime = await manamiManger.getEntryByAnidbId(search.anidbId).get();
        
        if (!anime) {
            throw new Error(`unknown anidbId: ${search.anidbId}`);
        }

        await fsp.mkdir(path.join(root, anime.folderName), { recursive: true });

        const magnets = await getNyaaResults(search.query);
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
            console.log([progress, torrent.state, torrent.name].join("\t"));

            const anime = hashToAnime[torrent.hash];
            if (!anime) {
                console.warn("rogue torrent, no anime found for magnet: ", torrent.magnet_uri, torrent.hash);
            }

            if (anime && torrent.progress === 1) {
                const contents = await qb.getTorrentContents(torrent.hash);
                for (const content of contents) {
                    const src = path.join(root, "downloads", content.name);
                    const dst = path.join(root, anime.folderName, content.name);
                    if (!fs.existsSync(dst)) {
                        console.log(`\tsrc: ${src}`);
                        console.log(`\tdst: ${dst}`);
                        await fsp.copyFile(src, dst);
                        console.log(`\t...done copying`);
                    }
                }
            }
        }

        console.log("----");
        setTimeout(loop, 10_000);
    };

    setTimeout(loop, 5000);
}

main().catch(console.error);
