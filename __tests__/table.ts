import {Deck, HoldemHandRanker, ICard, ITableDelegate, IWinner, Table, TableState} from '../src';

describe('Table tests', () => {
    test('Simple game', () => {
        class SimpleGame implements ITableDelegate<Table> {
            onChangeTableCards(table: Table, cards: Array<ICard>): void {}

            onChangeTableDealerIndex(table: Table, index: number): void {}

            onChangeTablePlaceIndex(table: Table, index: number): void {
                if (table.state === TableState.Blinds && table.currentPlace?.isBlind) {
                    expect(table.smallBlindIndex).not.toEqual(table.bigBlindIndex);
                    return table.currentPlace?.blind();
                }
                if (table.state <= TableState.WaitReady) {
                    return;
                }
                table.currentPlace?.check();
            }

            onChangeTableState(table: Table, state: TableState): Promise<void> {
                return Promise.resolve();
            }

            onTableFoundWinners(table: Table, winners: Array<IWinner>): void {
                expect(winners.length).not.toEqual(0);
                expect(winners.length).toBeGreaterThanOrEqual(1);
            }
        }
        const table = new Table('test', new Deck(), new HoldemHandRanker(), new SimpleGame(), 2, 2, 4, 2);
        table
            .getPlaceByIndex(0)
            ?.setPlayer({
                id: '1',
            })
            .setChips(100)
            .ready();
        table
            .getPlaceByIndex(1)
            ?.setPlayer({
                id: '2',
            })
            .setChips(100)
            .ready();
    });
});
