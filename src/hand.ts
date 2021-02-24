import {ICard} from './interfaces';
import {Kinds} from './kinds';

export class Hand {
    static isFlush(cards: ICard[]): boolean {
        return cards.every((c) => c.suit === cards[0].suit);
    }

    static isAceLowStraight(cards: ICard[]): boolean {
        if (cards.length < 1) {
            return false;
        }
        let high,
            low,
            ranks: number[] = [];

        high = low = cards[0].rank;
        for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            const r = c.rank;

            if (ranks.indexOf(r) !== -1) {
                return false;
            }
            ranks.push(r);
            if (r > high) {
                high = r;
            }
            if (r < low) {
                low = r;
            }
        }
        return high - low === 4;
    }

    static isAceHighStraight(cards: ICard[]): boolean {
        if (cards.length < 1) {
            return false;
        }
        let high,
            low,
            ranks: number[] = [];

        high = low = cards[0].rank;
        for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            let r = c.rank;
            if (r === 1) {
                r = 14;
            }
            if (ranks.indexOf(r) !== -1) {
                return false;
            }
            ranks.push(r);
            if (r > high) {
                high = r;
            }
            if (r < low) {
                low = r;
            }
        }
        return high - low === 4;
    }

    static isStraight(cards: ICard[]): boolean {
        return Hand.isAceHighStraight(cards) || Hand.isAceLowStraight(cards);
    }

    static has(cards: ICard[], ...ranks: number[]): boolean {
        return cards.some((c) => {
            const r = c.rank,
                i = ranks.indexOf(r);
            if (i !== -1) {
                ranks.splice(i, 1);
            }
            return ranks.length === 0;
        });
    }

    public readonly cards: ICard[];
    public readonly kinds: Kinds;
    public readonly isFlush: boolean;
    public readonly isStraight: boolean;

    constructor(cards: ICard[]) {
        this.cards = cards;
        this.kinds = new Kinds(cards);
        this.isFlush = Hand.isFlush(cards);
        this.isStraight = Hand.isStraight(cards);
    }

    public has = (...ranks: number[]): boolean => Hand.has(this.cards, ...ranks);
}
