export interface ICard {
    value: string;
    suit: string;
    rank: number;
}

export interface ICards {
    cards: Array<ICard>;
}

export interface IDeck {
    capacity: number;
    length: number;

    shuffle(): void;
    reset(): void;
    draw(): ICard | undefined;
}

export interface IKindsGroup extends ICards {
    rank: number;
}

export interface IPlace extends ICards {
    index: number;
    state: number;
    chips: number;

    bet: number;

    player: IPlayer | null;

    // Flags
    isAvailable: boolean;
    isCurrent: boolean;
    isDealer: boolean;
    isBlind: boolean;
    isFold: boolean;

    // Actions
    call(): void;
    fold(): void;
    ready(): void;
    blind(): void;
    check(): void;
    raise(chips: number): void;
}

export interface IPlaceDelegate {
    onChangePlace(place: IPlace, reason: 'state' | 'bet' | 'player', onlyInform?: boolean): void;
}

export interface IPlayer {
    id: string;
}

export interface IWinner extends ICards {
    maxRankCards: number;
    score: number;
    index: number;
    rank: string;
    id?: string;
}

export interface IScore extends ICards {
    value: number;
    rank: string;
}

export interface IPlaceScore extends IScore {
    maxRankCards: number;
    place: IPlace;
}

export interface IRankChecker<T extends ICards> {
    name?: string;
    payout: number;

    check(hand: T): Array<ICard> | false;
}

export interface IRanker {
    getScore(cards: Array<ICard>): IScore;
    winners(storage: ICards, places: Array<IPlace>): Array<IPlaceScore>;
}

export interface ITable extends ICards {
    // Identifier, for integrations
    id?: string;

    // Round data
    bet: number;
    bets: Array<number>;
    state: number;
    placeIndex: number;
    dealerIndex: number;
    currentPlace: IPlace | undefined;

    // Blinds meta
    bigBlind: number;
    bigBlindIndex: number;
    smallBlind: number;
    smallBlindIndex: number;
}

export interface ITableDelegate<T extends ITable> {
    onChangeTableDealerIndex(table: T, index: number): void;
    onChangeTablePlaceIndex(table: T, index: number): void;
    onChangeTableCards(table: T, cards: Array<ICard>): void;
    onChangeTableState(table: T, state: number): Promise<void>;
    onTableFoundWinners(table: T, winners: Array<IWinner>): void;
}
