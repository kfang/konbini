import { TryAsync } from "@kfang/typescript-fp";
import axios, { AxiosInstance } from "axios";
import nodeHtmlParser from 'node-html-parser';
import { NyaaResult } from "./nyaa.models.mjs";
import { Logger } from "winston";

export interface INyaaManagerOpts {
    readonly host: string;
    readonly logger: Logger;
}

export class NyaaManager {

    public static build(opts: INyaaManagerOpts): NyaaManager {
        const client = axios.create({ baseURL: opts.host });
        return new NyaaManager(client, opts.logger);
    }


    private constructor(
        private readonly client: AxiosInstance,
        private readonly logger: Logger,
    ) {
        this.getNyaaResults = this.getNyaaResults.bind(this);
    }

    public getNyaaResults(query: string): TryAsync<NyaaResult[]> {
        const params = { c: "1_2", f: "0", q: query };

        return TryAsync.of(this.client.get("/", { params }))
            .map((res) => nodeHtmlParser.parse(res.data))
            .map((doc) => doc.querySelectorAll("table.torrent-list tbody tr"))
            .map((rows) => {
                const results: NyaaResult[] = [];
                
                for (const row of rows) {
                    const cells = row.getElementsByTagName("td");
                    
                    const name = cells[1]
                        .getElementsByTagName("a")
                        .filter((e) => e.getAttribute("class") !== "comments")[0]
                        .getAttribute("title");
                    
                    const [_, magnet] = cells[2].getElementsByTagName("a");
                    const magLink = magnet.getAttribute("href");
                    
                    if (name && magLink) {
                        results.push(new NyaaResult({ name, magnet: magLink }));
                    }
                }
                return results;
            })
            .recover((error) => {
                // TODO: do something about this error
                this.logger.error(error);
                return [];
            });
    }
}
