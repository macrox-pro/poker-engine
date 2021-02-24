import {HoldemHandRanker, IPlayer, IPlace, Card, cardsFromString} from '../src';

// @ts-ignore
import {Hand as PokerSolverHand} from 'pokersolver';

class SimplePlace implements IPlace {
    public readonly index: number;
    public readonly cards: Card[];

    bet: number = 0;
    isAvailable: boolean = false;
    isCurrent: boolean = false;
    isDealer: boolean = false;
    isBlind: boolean = false;
    isFold: boolean = false;
    state: number = 0;

    chips: number = 100;
    player: IPlayer | null = null;
    constructor(cards: string[], index: number) {
        this.cards = cards.map((v: any) => new Card(v));
        this.index = index;
    }

    blind(): void {}

    call(): void {}

    check(): void {}

    fold(): void {}

    raise(chips: number): void {}

    ready(): void {}
}

describe('Hand ranker tests', () => {
    test('holdem sorted keys', () => {
        // noinspection SpellCheckingInspection
        const ranker = new HoldemHandRanker();
        expect(ranker.keys.join(' > ')).toEqual(
            'ROYAL_FLUSH > STRAIGHT_FLUSH > FOUR_OF_A_KIND > FULL_HOUSE > FLUSH > STRAIGHT > THREE_OF_A_KIND > TWO_PAIR > JACKS_OR_BETTER',
        );
    });
    test('holdem score rank', () => {
        // noinspection SpellCheckingInspection
        const ranker = new HoldemHandRanker();
        expect(ranker.getScore(cardsFromString('AcKcQcJcTc')).rank).toEqual('ROYAL_FLUSH');
        expect(ranker.getScore(cardsFromString('9d8d7d6d5d')).rank).toEqual('STRAIGHT_FLUSH');
        expect(ranker.getScore(cardsFromString('AcAdAhAs9c')).rank).toEqual('FOUR_OF_A_KIND');
        expect(ranker.getScore(cardsFromString('QcQdQhJsJc')).rank).toEqual('FULL_HOUSE');
        expect(ranker.getScore(cardsFromString('AhJh9h6h3h')).rank).toEqual('FLUSH');
        expect(ranker.getScore(cardsFromString('9d8h7s6c5h')).rank).toEqual('STRAIGHT');
        expect(ranker.getScore(cardsFromString('5dQs2h2d2c')).rank).toEqual('THREE_OF_A_KIND');
        expect(ranker.getScore(cardsFromString('AcAdKsKh9d')).rank).toEqual('TWO_PAIR');
        expect(ranker.getScore(cardsFromString('4s5d8hAcAd')).rank).toEqual('JACKS_OR_BETTER');
        expect(ranker.getScore(cardsFromString('5h6dJcQdAs')).rank).toEqual('NONE');
    });
    test('holdem 6+ sorted keys', () => {
        // noinspection SpellCheckingInspection
        const ranker = new HoldemHandRanker(true);
        expect(ranker.keys.join(' > ')).toEqual(
            'ROYAL_FLUSH > STRAIGHT_FLUSH > FOUR_OF_A_KIND > FLUSH > FULL_HOUSE > THREE_OF_A_KIND > STRAIGHT > TWO_PAIR > JACKS_OR_BETTER',
        );
    });
    test('holdem6+ score rank', () => {
        // noinspection SpellCheckingInspection
        const ranker = new HoldemHandRanker(true);
        expect(ranker.getScore(cardsFromString('AcKcQcJcTc')).rank).toEqual('ROYAL_FLUSH');
        expect(ranker.getScore(cardsFromString('9d8d7d6d5d')).rank).toEqual('STRAIGHT_FLUSH');
        expect(ranker.getScore(cardsFromString('AcAdAhAs9c')).rank).toEqual('FOUR_OF_A_KIND');
        expect(ranker.getScore(cardsFromString('QcQdQhJsJc')).rank).toEqual('FULL_HOUSE');
        expect(ranker.getScore(cardsFromString('AhJh9h6h3h')).rank).toEqual('FLUSH');
        expect(ranker.getScore(cardsFromString('9d8h7s6c5h')).rank).toEqual('STRAIGHT');
        expect(ranker.getScore(cardsFromString('5dQs2h2d2c')).rank).toEqual('THREE_OF_A_KIND');
        expect(ranker.getScore(cardsFromString('AcAdKsKh9d')).rank).toEqual('TWO_PAIR');
        expect(ranker.getScore(cardsFromString('4s5d8hAcAd')).rank).toEqual('JACKS_OR_BETTER');
        expect(ranker.getScore(cardsFromString('5h6dJcQdAs')).rank).toEqual('NONE');
    });
    test('pokersolver winners basic', () => {
        const a = ['Ac', 'Kc', 'Qc', 'Jc', 'Tc'];
        const b = ['Qc', 'Qd', 'Qh', 'Js', 'Jc'];

        // PokerSolver winners
        const winners = PokerSolverHand.winners([PokerSolverHand.solve(a), PokerSolverHand.solve(b)]);
        expect(winners.length).toEqual(1);
        expect(winners[0].descr.toLowerCase()).toEqual('royal flush');

        // My winners
        const ranker = new HoldemHandRanker();
        const scores = ranker.winners({cards: []}, [new SimplePlace(a, 0), new SimplePlace(b, 1)]);
        expect(scores.length).toEqual(1);
        expect(scores[0].rank).toEqual('ROYAL_FLUSH');
    });
    test('pokersolver winners high card', () => {
        const a = ['Qc', '6c', '5d', '8h', 'Tc'];
        const b = ['Ac', '6c', '5d', '8h', 'Tc'];

        // PokerSolver winners
        const winners = PokerSolverHand.winners([PokerSolverHand.solve(a), PokerSolverHand.solve(b)]);
        expect(winners.length).toEqual(1);
        expect(winners[0].descr.toLowerCase()).toEqual('a high');

        // My winners
        const ranker = new HoldemHandRanker();
        const scores = ranker.winners({cards: []}, [new SimplePlace(a, 0), new SimplePlace(b, 1)]);
        expect(scores.length).toEqual(1);
        expect(scores[0].maxRankCards).toEqual(13);
    });
});
