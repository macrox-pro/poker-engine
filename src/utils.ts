import {ICard} from './interfaces';
import {Card} from './card';

export function cardsFromString(str: string): ICard[] {
    const parts = str.match(/.{1,2}/g),
        result: ICard[] = [];
    for (const part of parts || []) {
        try {
            result.push(new Card(part as any));
        } catch (e) {
            console.warn(e);
        }
    }
    return result;
}
