import {Deck} from '../src';

describe('Deck tests', () => {
    test('52 cards', () => {
        expect(new Deck(52).ranks.join('')).toEqual('23456789TJQKA');
    });
    test('54 cards', () => {
        expect(new Deck(52).ranks.join('')).toEqual('23456789TJQKA');
    });
    test('36 cards', () => {
        expect(new Deck(36).ranks.join('')).toEqual('6789TJQKA');
    });
    test('Need reset before draw', () => {
        const deck = new Deck(52);
        expect(deck.draw()?.rank || 0).toBeLessThanOrEqual(0);
        expect(deck.length).toEqual(0);
    });
    test('Shuffle before reset', () => {
        const deck = new Deck(52);
        try {
            deck.shuffle();
        } catch (e) {
            expect(e?.message?.toLowerCase()).toContain('desk is empty');
        }
        expect(deck.length).toEqual(0);
    });
    test('Draw', () => {
        const deck = new Deck(52);
        deck.reset();
        expect(deck.draw()?.rank || 0).toBeGreaterThan(0);
        expect(deck.length).toEqual(51);
    });
});
