import {ICard, ICards, IPlace, IPlaceScore, IRankChecker, IRanker, IScore} from './interfaces';

import {PlaceScore} from './place';
import {Hand} from './hand';

// noinspection SpellCheckingInspection
export class HoldemHandRanker implements IRanker {
    private readonly checkers: Record<string, IRankChecker<Hand>>;
    public readonly keys: Array<string>;

    /**
     * @param plus - use holdem+ (default false)
     */
    constructor(plus: boolean = false) {
        this.checkers = {
            ROYAL_FLUSH: {
                payout: 100,
                check: (hand: Hand): ICard[] | false => {
                    if (hand.isFlush && hand.isStraight && hand.has(9, 10, 11, 12, 13)) {
                        return hand.cards;
                    }
                    return false;
                },
            },
            STRAIGHT_FLUSH: {
                payout: 50,
                check: (hand: Hand): ICard[] | false => {
                    if (hand.isFlush && hand.isStraight) {
                        return hand.cards;
                    }
                    return false;
                },
            },
            FOUR_OF_A_KIND: {
                payout: 25,
                check: (hand: Hand): ICard[] | false => {
                    const res = hand.kinds.has(4);
                    if (res !== false) {
                        return res.cards;
                    }
                    return res;
                },
            },
            FULL_HOUSE: {
                payout: !plus ? 9 : 6,
                check: (hand: Hand): ICard[] | false => (hand.kinds.has(3) && hand.kinds.has(2) ? hand.cards : false),
            },
            FLUSH: {
                payout: !plus ? 6 : 9,
                check: (hand: Hand): ICard[] | false => (hand.isFlush ? hand.cards : false),
            },
            STRAIGHT: {
                payout: !plus ? 4 : 3,
                check: (hand: Hand): ICard[] | false => (hand.isStraight ? hand.cards : false),
            },
            THREE_OF_A_KIND: {
                payout: !plus ? 3 : 4,
                check: (hand: Hand): ICard[] | false => {
                    const res = hand.kinds.has(3);
                    if (res !== false) {
                        return res.cards;
                    }
                    return res;
                },
            },
            TWO_PAIR: {
                payout: 2,
                check: (hand: Hand): ICard[] | false => {
                    const res = hand.kinds.all(2);
                    if (res !== false && res.length === 2) {
                        let cards: ICard[] = [];
                        res.forEach((kg) => {
                            cards = cards.concat(kg.cards);
                        });
                        return cards;
                    }
                    return false;
                },
            },
            JACKS_OR_BETTER: {
                payout: 1,
                check: (hand: Hand): ICard[] | false => {
                    const res = hand.kinds.has(2);
                    if (res && (res.rank >= 11 || res.rank === 1)) {
                        return res.cards;
                    }
                    return false;
                },
            },
        };
        this.keys = Object.keys(this.checkers).sort((a, b) => {
            return this.checkers[b].payout - this.checkers[a].payout;
        });
    }

    public winners = (storage: ICards, places: IPlace[]): IPlaceScore[] => {
        let maxScoreValue = 0;
        const scores = places.map((place) => {
            const score = this.getScore([...storage.cards, ...place.cards]);
            maxScoreValue = Math.max(maxScoreValue, score.value);
            return new PlaceScore(place, score);
        });
        return scores.filter((score) => {
            if (score.value !== maxScoreValue) {
                return false;
            }
            for (let i = 0; i < scores.length; i++) {
                if (scores[i].value !== maxScoreValue) {
                    continue;
                }
                if (score.loseTo(scores[i])) {
                    return false;
                }
            }
            return true;
        });
    };

    public getScore = (cards: ICard[]): IScore => {
        const hand = new Hand(cards);
        for (const x of this.keys) {
            const result = this.checkers[x].check(hand);
            if (result) {
                return {
                    value: this.checkers[x].payout,
                    cards: result,
                    rank: x,
                };
            }
        }
        return {
            cards,
            value: 0,
            rank: 'NONE',
        };
    };
}
