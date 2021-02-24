import {ICard} from './interfaces';

export class Card implements ICard {
    public static readonly suits = ['c', 'd', 'h', 's'];
    public static readonly values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

    public static sort(a: Card, b: Card) {
        if (a.rank > b.rank) {
            return -1;
        } else if (a.rank < b.rank) {
            return 1;
        }
        return 0;
    }

    readonly rank: number;
    readonly suit: string;
    readonly value: string;

    constructor(input: string | [string, string]) {
        if (input.length < 2) {
            throw new Error('INV_CARD_VALUE');
        }
        if (typeof input === 'string') {
            this.value = input.substr(0, 1);
            this.suit = input.substr(1, 1).toLowerCase();
        } else {
            this.value = input[0].substr(0, 1);
            this.suit = input[1].substr(0, 1).toLowerCase();
        }
        this.rank = Card.values.indexOf(this.value);
    }

    public toString(): string {
        return `${this.value}${this.suit}`;
    }

    public compare(card: Card): number {
        return Card.sort(this, card);
    }
}
