export enum TableState {
    WaitPlayers = -1,
    WaitReady = 0,
    Blinds = 1,
    Distribution = 2,
    PreFlop = 3,
    Flop = 4,
    Turn = 5,
    River = 6,
    ShowDown = 7,
    Result = 8,
}

export enum PlaceState {
    NoPlayer = -1,
    None = 0,
    Fold = 1,
    Ready = 2,
    Wait = 3,
    SmallBlind = 4,
    BigBlind = 5,
    Check = 6,
    Call = 7,
    Raise = 8,
}
