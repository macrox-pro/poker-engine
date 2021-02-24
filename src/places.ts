import _ from 'lodash';

import {PlaceState} from './enums';
import {IPlace} from './interfaces';

export class Places<T extends IPlace> {
    private readonly _map: Record<number, T> = {};
    private readonly _indexes: number[] = [];
    private readonly _capacity: number;

    public get length(): number {
        return this._capacity;
    }

    public get bet(): number {
        return Object.values(this._map).reduce((max: number, place: T) => Math.max(max, place.bet), 0);
    }

    public get counts(): {withPlayer: number; ready: number} {
        return Object.values(this._map).reduce(
            (result, place: T) => {
                result.withPlayer += place.player !== null ? 1 : 0;
                result.ready += place.state >= PlaceState.Ready ? 1 : 0;
                return result;
            },
            {
                withPlayer: 0,
                ready: 0,
            },
        );
    }

    public get active(): T[] {
        return _.values(this._map).filter((item) => !item.isFold);
    }

    constructor(builder: (index: number) => T, capacity: number) {
        this._capacity = capacity;
        for (let i = 0; i < capacity; i++) {
            this._map[i] = builder(i);
            this._indexes.push(i);
        }
    }

    public getByIndex = (index: number): T | undefined => {
        if (index < 0 || index >= this._capacity) {
            return undefined;
        }
        return this._map[index];
    };

    public findNextIndexAfter = (index: number, useBet = true, useCycle = true): number => {
        const bet = useBet ? this.bet : 0;
        const predicate = (i: number) => !this._map[i].isFold && (!useBet || this._map[i].bet !== bet);
        if (index >= 0 && index < this._capacity - 1) {
            const i = this._indexes.slice(index).findIndex(predicate);
            if (i >= 0) {
                return index + i + 1;
            }
        }
        if (!useCycle) {
            return -1;
        }
        return this._indexes.slice(0, index).findIndex(predicate);
    };

    public forEach = (cb: (value: T, index: number, array: T[]) => any) => Object.values(this._map).forEach(cb as any);
}
