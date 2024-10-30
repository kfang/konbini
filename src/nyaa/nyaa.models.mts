export interface INyaaResult {
    magnet: string;
    name: string;
}

export class NyaaResult {
    constructor(private readonly result: INyaaResult) {}

    get magnet(): string {
        return this.result.magnet;
    }
    get name(): string {
        return this.result.name;
    }
}
