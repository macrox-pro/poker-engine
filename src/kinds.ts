import {ICard, IKindsGroup} from "./interfaces";

export class Kinds {
    private readonly cache: Record<string, IKindsGroup[]> = {}
    private readonly kinds: Record<number, ICard[]> = {}

    constructor(cards: ICard[]) {
        cards.forEach((c) => {
            if (!(c.rank in this.kinds)) {
                this.kinds[c.rank] = [];
            }
            this.kinds[c.rank].push(c);
        });
    }

    public has = (numOfKinds: number): IKindsGroup | false => {
        const groups = this.all(numOfKinds, true);
        if (!groups) {
            return false;
        }
        return groups[0];
    };

    public all = (numOfKinds: number, onlyFirst: boolean = false): IKindsGroup[]| false => {
        const cacheKey = `${numOfKinds}.${onlyFirst}`,
            result: IKindsGroup[] = cacheKey in this.cache ? this.cache[cacheKey] : [];
        if (result.length < 1) {
            for (let key of Object.keys(this.kinds)) {
                const rank = parseInt(key, 10);
                if (this.kinds[rank].length === numOfKinds) {
                    result.push({
                        cards: this.kinds[rank],
                        rank: +rank,
                    });
                    if (onlyFirst) {
                        break;
                    }
                }
            }
            if (result.length === 0) {
                return false;
            }
            this.cache[cacheKey] = result;
        }
        return result;
    };
}
