import * as React from 'react';
import { privateState, StateProvider } from '../core/private-state';

let counter: number = 0;
const provider: StateProvider<{id: number}, object> = privateState('globalId', () => ({ id: counter++ }));
export const separator = '##';

export function isComponentInstance(value: any): value is React.Component {
    return value && value instanceof React.Component;
}

export interface GlobalIDTarget {
    id?: string;
}

export function getRootId(obj: object): string {
    if (isComponentInstance(obj)) {
        if (obj.props && obj.props.hasOwnProperty('id')) return (obj.props as {id: string}).id;
    } else {
        if (obj.hasOwnProperty('id')) return (obj as {id: string}).id;
    }

    return `${provider(obj).id}`;
}

export function getLocalId(rootId: string, id: string): string {
    return `${rootId}${separator}${id}`;
}


