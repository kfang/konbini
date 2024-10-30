interface IFilenameToken {
    type: "token" | "tag" | "extension";
    value: string;
}


function getTag(iter: Iterator<string>): IFilenameToken {
    let count = 1;
    let tag = "";
    let next = iter.next();
    while(!next.done) {
        const char = next.value;
        if (char === "[") {
            count++;
        } 
        
        if (char === "]") {
            count--;
        }

        if (count === 0) {
            break;
        }

        tag += char;
        next = iter.next();
    }

    return { type: "tag", value: tag };
}

function getTokens(iter: Iterator<string>): IFilenameToken[] {
    const tokens: IFilenameToken[] = [];

    let next = iter.next();
    let curr = "";

    while (!next.done) {
        switch(next.value) {
            case " ":
            case "-":
            case ".":
                if (curr !== "") {
                    tokens.push({ type: "token", value: curr });
                    curr = "";
                }
                break;
            case "[":
                tokens.push(getTag(iter));
                break;
            default:
                curr += next.value;
                break;
        }
        next = iter.next();
    }

    if (curr !== "") {
        tokens.push({ type: "extension", value: curr });
    }

    return tokens;
}

interface IFilenameInfo {
    tags: string[];
    episodeNumber: string | null;
}

function parse(filename: string): IFilenameInfo {
    const results: IFilenameInfo = { tags: [], episodeNumber: null };
    const tokens = getTokens(filename[Symbol.iterator]());

    console.log(tokens);

    for (const token of tokens) {
        if (token.type === "tag") {
            results.tags.push(token.value);
        }

        if (token.type === "token") {
            results.episodeNumber = token.value;
        }
    }

    return results;
}

