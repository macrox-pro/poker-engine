import _ from 'lodash';

import {ICard, IPlace, IPlaceDelegate, IPlaceScore, IPlayer, IScore, ITable} from './interfaces';
import {PlaceState, TableState} from './enums';

export class PlaceScore implements IPlaceScore {
    public readonly place: IPlace;
    public readonly rank: string;
    public readonly value: number;
    public readonly cards: ICard[];

    public readonly maxRankCards: number;

    constructor(place: IPlace, score: IScore) {
        this.place = place;
        this.rank = score.rank;
        this.cards = score.cards;
        this.value = score.value;
        this.maxRankCards = Math.max.apply(
            Math,
            this.cards.map(function (c) {
                return c.rank;
            }),
        );
    }

    public loseTo = (item: IPlaceScore): boolean => {
        if (this.value < item.value) {
            return true;
        } else if (this.value > item.value) {
            return false;
        }
        return this.maxRankCards < item.maxRankCards;
    };
}

interface ITableWithPlaceDelegate extends ITable, IPlaceDelegate {}

export class Place<T extends ITableWithPlaceDelegate> implements IPlace {
    private readonly _table: T;

    private readonly _index: number;

    private _cards: Array<ICard> = [];
    private _state: PlaceState = PlaceState.NoPlayer;
    private _player: IPlayer | null = null;
    private _chips: number = 0;
    private _bet: number = 0;

    public get state(): PlaceState {
        return this._state;
    }

    public get bet() {
        return this._bet;
    }

    public get chips() {
        return this._chips;
    }

    public get player() {
        return this._player;
    }

    public set player(value: IPlayer | null) {
        this.setPlayer(value);
    }

    public get index() {
        return this._index;
    }

    public get cards(): Array<ICard> {
        if (this._cards.length < 1) {
            return [];
        }
        return _.clone(this._cards);
    }

    public get isCurrent(): boolean {
        return this._table.placeIndex === this.index;
    }

    public get isDealer(): boolean {
        return this._table.dealerIndex === this.index;
    }

    public get isBigBlind(): boolean {
        return this._table.bigBlindIndex === this.index;
    }

    public get isSmallBlind(): boolean {
        return this._table.smallBlindIndex === this.index;
    }

    public get isBlind(): boolean {
        return this.isSmallBlind || this.isBigBlind;
    }
    public get isAvailable(): boolean {
        return !!this._table && !!this._player;
    }

    public get isFold(): boolean {
        return !this.isAvailable || (this._state <= PlaceState.Fold && this._state !== PlaceState.None);
    }

    constructor(table: T, index: number, chips = 0) {
        this._index = index;
        this._table = table;
        this._chips = chips;
    }

    public setChips = (chips: number) => {
        if (this._player) {
            this._chips = chips;
        }
        return this;
    };

    public setPlayer = (player: IPlayer | null) => {
        if (!(this._player && player)) {
            this._player = player;
            this.setState(!this._player ? PlaceState.NoPlayer : PlaceState.None, 'player');
        }
        return this;
    };

    private placeBet = (chips: number, nextState?: PlaceState): void => {
        if (this._state < PlaceState.Ready) {
            throw new Error('Not allowed to place bets');
        }
        if (this._chips - chips < 0) {
            throw new Error('Not enough chips');
        }
        this._chips -= chips;
        this._bet += chips;

        // Change state if need it
        nextState && this.setState(nextState, 'bet', true);
    };

    public blind = (): void => {
        if (!this.isCurrent || this.isFold || this._state >= PlaceState.SmallBlind) {
            return;
        }
        if (this.isSmallBlind) {
            return this.placeBet(this._table.smallBlind, PlaceState.SmallBlind);
        }
        if (this.isBigBlind) {
            return this.placeBet(this._table.bigBlind, PlaceState.BigBlind);
        }
    };

    public ready = (): void => {
        if (this._table.state > TableState.WaitReady) {
            return console.log('Table state not wait ready!');
        }
        this.setState(PlaceState.Ready);
    };

    public fold = (): void => {
        if (!this.isCurrent || this.isFold) {
            return;
        }
        this.setState(PlaceState.Fold);
    };

    public raise = (chips: number): void => {
        if (!this.isCurrent || this.isFold) {
            return;
        }
        this.placeBet(chips, PlaceState.Raise);
    };

    public call = (): void => {
        if (!this.isCurrent || this.isFold) {
            return;
        }
        this.placeBet(Math.max(0, this._table.bet - this._bet), PlaceState.Call);
    };

    public check = (): void => {
        if (!this.isCurrent || this.isFold) {
            return;
        }
        this.setState(PlaceState.Check);
    };

    public takeBet = () => {
        const bet = this._bet;
        this._bet = 0;
        if (!this.isFold) {
            this.setState(this._chips <= 0 ? PlaceState.Fold : PlaceState.Wait, 'bet', true, true);
        }
        return bet;
    };

    public resetState = (): void => {
        this.setState(this.player === null ? PlaceState.NoPlayer : PlaceState.None, 'state', true, true);
    };

    public distribution = (cards: ICard[]): void => {
        if (this.isFold || this._table.state !== TableState.Distribution) {
            return console.warn('Not allowed to distribution cards');
        }
        this._cards = [...cards];
    };

    private setState = (
        state: PlaceState,
        initiator: 'state' | 'bet' | 'player' = 'state',
        force = false,
        onlyInform = false, // Только информировать, не для рассчета
    ): void => {
        if (this._state === state && !force) {
            return;
        }
        this._state = state;
        try {
            this._table.onChangePlace(this, initiator, onlyInform);
        } catch (e) {
            console.warn('Cannot track place state changes on the table', e);
        }
    };
}
