import {ICard, IDeck} from './interfaces';

import {Card} from './card';

export class Deck implements IDeck {
    private readonly _randomFn: () => number;
    private readonly _ranks: Array<string>;
    private _cards: Array<ICard> = [];

    public readonly capacity: number;

    public get ranks(): Array<string> {
        return [...this._ranks];
    }
    public get length(): number {
        return this._cards.length;
    }

    constructor(capacity: 36 | 52 | 54 | number = 52, randomFn = Math.random) {
        // Validate capacity
        const length = Math.floor(capacity / Card.suits.length);
        if (length <= 0 || capacity < 36 || capacity > 54 || (length >= Card.values.length && capacity != 54)) {
            throw new Error('INV_DECK_CAPACITY');
        }
        this._ranks = [...Card.values].slice(1 + Math.max(0, Math.floor((52 - capacity) / Card.suits.length)));
        this._randomFn = randomFn;
        this.capacity = capacity;
    }

    public reset = (): void => {
        this._cards = [];
        Card.suits.forEach((suit) => {
            this._ranks.forEach((value) => {
                this._cards.push(new Card([value, suit]));
            });
        });
        if (this.capacity >= 54) {
            this._cards.push(new Card('1h'));
            this._cards.push(new Card('1s'));
        }
        this.shuffle();
    };

    public draw = (): ICard | undefined => this._cards.shift();

    public shuffle = (): void => {
        const length = this.length;
        if (length <= 0) {
            throw new Error('Desk is empty');
        }
        if (length === 1) {
            return;
        }
        for (let i = this._cards.length; i > 0; i--) {
            let j = Math.floor(this._randomFn() * i);
            [this._cards[i - 1], this._cards[j]] = [this._cards[j], this._cards[i - 1]];
        }
    };
}
