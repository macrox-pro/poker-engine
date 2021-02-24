import _ from 'lodash';

import {ICard, IDeck, IPlace, IPlaceDelegate, IRanker, ITable, ITableDelegate} from './interfaces';
import {PlaceState, TableState} from './enums';
import {Places} from './places';
import {Place} from './place';

export class Table implements ITable, IPlaceDelegate {
    private _state: TableState = TableState.WaitPlayers;
    private _places: Places<Place<Table>>;
    private _delegate: ITableDelegate<Table>;
    private _cardsPerPlayer: number = 2;
    private _dealerIndex: number = -1;
    private _placeIndex: number = -1;
    private _smallBlind: number;
    private _bigBlind: number;
    private _ranker: IRanker;
    private _deck: IDeck;

    private readonly _id?: string;

    // Round data
    private _cache: Record<string, any> = {};
    private _cards: Array<ICard> = [];
    private _bets: Array<number> = [];

    public get smallBlindIndex(): number {
        if (this._dealerIndex < 0) {
            return -1;
        }
        if (!('smallBlindIndex' in this._cache)) {
            this._cache.smallBlindIndex = this._places.findNextIndexAfter(this._dealerIndex, false);
        }
        return this._cache.smallBlindIndex;
    }

    public get bigBlindIndex(): number {
        if (this._dealerIndex < 0) {
            return -1;
        }
        if (!('bigBlindIndex' in this._cache)) {
            this._cache.bigBlindIndex = this._places.findNextIndexAfter(this.smallBlindIndex, false);
        }
        return this._cache.bigBlindIndex;
    }

    public get currentPlace() {
        return this._places.getByIndex(this._placeIndex);
    }

    public get smallBlind(): number {
        return this._smallBlind || this._bigBlind / 2;
    }

    public get dealerIndex() {
        return this._dealerIndex;
    }

    public get placeIndex() {
        return this._placeIndex;
    }

    public get bigBlind(): number {
        return this._bigBlind;
    }

    public get bets(): Array<number> {
        return [...this._bets];
    }

    public get cards(): Array<ICard> {
        return [...this._cards];
    }

    public get state() {
        return this._state;
    }

    public get bet() {
        return this._places.bet;
    }

    public get id() {
        return this._id;
    }

    constructor(
        id: string,
        deck: IDeck,
        ranker: IRanker,
        delegate: ITableDelegate<Table>,
        cardsPerPlayer: number,
        smallBlind: number,
        bigBlind: number,
        places: number,
    ) {
        this._places = new Places((index) => {
            return new Place(this, index);
        }, Math.max(2, places));
        this._cardsPerPlayer = cardsPerPlayer || 2;
        this._smallBlind = smallBlind || bigBlind / 2;
        this._bigBlind = bigBlind;
        this._delegate = delegate;
        this._ranker = ranker;
        this._deck = deck;
        this._id = id;
    }

    onChangePlace(place: IPlace, reason: 'state' | 'bet' | 'player', onlyInform?: boolean): void {
        // INFO: Если нужно только информировать, то выходим
        if (onlyInform) {
            return;
        }
        // INFO: Для состояния ожидания готовности игнорируем все статусы кроме Ready
        if (this._state === TableState.WaitReady && place.state !== PlaceState.Ready) {
            return;
        }
        // INFO: Если статус стола в игре, то реагируем только на изменения текущих мест
        if (
            (this._state > TableState.Distribution && this._placeIndex !== place.index) ||
            this._state >= TableState.ShowDown
        ) {
            return;
        }
        // Обрабатываем события в зависимости от состояния стола
        switch (this._state) {
            case TableState.WaitPlayers:
                if (this._places.counts.withPlayer >= 2) {
                    this.setState(TableState.WaitReady);
                }
                break;
            case TableState.WaitReady:
                const {withPlayer, ready} = this._places.counts;
                if (withPlayer >= 2 && withPlayer === ready) {
                    this.setState(TableState.Blinds);
                }
                break;
            case TableState.Blinds:
                if (!place.isBlind) {
                    return;
                }
                if (
                    this.smallBlind === (this._places.getByIndex(this.smallBlindIndex)?.bet || 0) &&
                    this.bigBlind === (this._places.getByIndex(this.bigBlindIndex)?.bet || 0)
                ) {
                    this.setState(TableState.Distribution);
                } else {
                    this.setPlayerIndex(place.index + 1);
                }
                break;
            case TableState.PreFlop:
            case TableState.Flop:
            case TableState.Turn:
            case TableState.Result:
                if (this.setPlayerIndex(this._places.findNextIndexAfter(place.index + 1)) < 0) {
                    this.setState(this._state + 1);
                }
                break;
            default:
                break;
        }
    }

    public getPlaceByIndex = (index: number) => this._places.getByIndex(index);

    private setPlayerIndex = (index: number): number => {
        this._placeIndex = index % this._places.length;
        this._delegate.onChangeTablePlaceIndex(this, this._placeIndex);
        return this._placeIndex;
    };

    private setDealerIndex = (index: number): number => {
        this._dealerIndex = index % this._places.length;
        this._delegate.onChangeTableDealerIndex(this, this._dealerIndex);
        return this._dealerIndex;
    };

    private takeBets = () => {
        this._places.forEach((place: Place<Table>) => {
            if (!place.isFold && place.state >= PlaceState.Ready) {
                const bet = place.takeBet();
                if (bet > 0) {
                    this._bets.push(bet);
                }
            }
        });
    };

    private setState = (state: TableState, force = false): void => {
        if (this._state === state && !force) {
            return;
        }
        this._state = state;
        const promise = this._delegate.onChangeTableState(this, state);
        switch (state) {
            // Ожидание готовности и выставляем индекс дилера
            case TableState.WaitReady:
                this.setDealerIndex(this.dealerIndex < 0 ? _.random(0, this._places.length - 1) : this.dealerIndex + 1);
                break;

            // Слупые ставки
            case TableState.Blinds:
                this.setPlayerIndex(this.smallBlindIndex);
                break;

            // Раздача карт
            case TableState.Distribution:
                this.takeBets();
                this._deck.reset();
                this._places.forEach((place) => {
                    if (place.isFold) {
                        return;
                    }
                    // Distribute cards
                    place.distribution(
                        Array(Math.max(2, this._cardsPerPlayer || 0))
                            .fill(null)
                            .map(() => this._deck.draw()) as [],
                    );
                });
                promise.finally(() => this.setState(TableState.PreFlop));
                break;

            // Предварительный раунд
            case TableState.PreFlop:
                this.setPlayerIndex(this._places.findNextIndexAfter(this.bigBlindIndex + 1, false));
                break;

            // Флоп
            case TableState.Flop:
                this.takeBets();
                this._cards = [this._deck.draw(), this._deck.draw(), this._deck.draw()].filter(
                    (card) => !!card,
                ) as Array<ICard>;
                this._delegate.onChangeTableCards(this, this.cards);
                if (this.setPlayerIndex(this._places.findNextIndexAfter(this.dealerIndex + 1)) < 0) {
                    promise.finally(() => this.setState(TableState.ShowDown));
                }
                break;

            // Терн и Ривер
            case TableState.Turn:
            case TableState.River:
                this.takeBets();
                const card = this._deck.draw();
                if (!card) {
                    promise.finally(() => this.setState(TableState.ShowDown));
                    break;
                }
                this._cards.push(card);
                this._delegate.onChangeTableCards(this, this.cards);
                if (this.setPlayerIndex(this._places.findNextIndexAfter(this.dealerIndex + 1)) < 0) {
                    promise.finally(() => this.setState(TableState.ShowDown));
                }
                break;

            // Вскрытие карт (шоудаун)
            case TableState.ShowDown:
                this.takeBets();
                this._delegate.onTableFoundWinners(
                    this,
                    this._ranker.winners(this, this._places.active).map((item) => {
                        return {
                            maxRankCards: item.maxRankCards,
                            index: item.place.index,
                            cards: item.cards,
                            score: item.value,
                            rank: item.rank,
                            id: this._places.getByIndex(item.place.index)?.player?.id,
                        };
                    }),
                );
                promise.finally(() => this.setState(TableState.Result));
                break;

            // Вывод результата
            case TableState.Result:
                this._cache = {};
                this._cards = [];
                this._places.forEach((value) => value.resetState());
                this._delegate.onChangeTableCards(this, []);
                promise.finally(() =>
                    this.setState(this._places.counts.withPlayer < 2 ? TableState.WaitPlayers : TableState.WaitReady),
                );
                break;

            default:
                console.log('Ignore reaction for table state - ', state);
                break;
        }
        promise.catch((err: Error) => console.warn(err));
    };
}
