import { TryAsync } from "@kfang/typescript-fp";
import axios, { AxiosInstance } from "axios";
import nodeHtmlParser from 'node-html-parser';

export interface INyaaManagerOpts {
    readonly host: string;
}

export class NyaaManager {

    public static build(opts: INyaaManagerOpts): NyaaManager {
        const client = axios.create({ baseURL: opts.host });
        return new NyaaManager(client);
    }


    private constructor(private readonly client: AxiosInstance) {
        this.getNyaaResults = this.getNyaaResults.bind(this);
    }

    public getNyaaResults(query: string): TryAsync<string[]> {
        const params = { c: "1_2", f: "0", q: query };

        return TryAsync.of(this.client.get("/", { params }))
            .map((res) => nodeHtmlParser.parse(res.data))
            .map((doc) => doc.querySelectorAll("table.torrent-list tbody tr"))
            .map((rows) => {
                const results: string[] = [];
                for (const row of rows) {
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
                return results;
            })
            .recover((error) => {
                // TODO: do something about this error
                console.error(error);
                return [];
            });
    }
}
