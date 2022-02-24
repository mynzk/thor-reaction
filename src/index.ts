import { useState, useEffect, useRef } from 'react';

export interface Schedule {
    schedule: () => unknown | void;
    dependencies: Set<Set<Schedule>>;
}

export const isFn = (x: any): x is Function => typeof x === 'function';
export type SetValueType<S> = S | ((prevValue: S) => S);
export type SetterOrUpdater<T> = (value: T) => void;

const context: any[] = [];

function subscribe(schedule: Schedule, subscriptions: Set<Schedule>) {
    subscriptions.add(schedule);
    schedule.dependencies.add(subscriptions);
}

export function createSignal<T>(value: T): [() => T, SetterOrUpdater<SetValueType<T>>] {
    const subscriptions = new Set<Schedule>();

    const read = (): T => {
        const schedule = context[context.length - 1];
        if (schedule) subscribe(schedule, subscriptions);
        return value;
    };

    const write = (nextValue: SetValueType<T>) => {
        value = isFn(nextValue) ? nextValue(value) : nextValue;
        for (const sub of Array.from(subscriptions)) {
            sub.schedule();
        }
    };
    return [read, write];
}

function cleanup(reaction: any) {
    for (const dep of reaction.dependencies) {
        dep.delete(reaction);
    }
    reaction.dependencies.clear();
}

export function createReaction(schedule: () => void | unknown) {
    function track(fn: () => void) {
        cleanup(reaction);
        context.push(reaction);
        try {
            fn();
        } finally {
            context.pop();
        }
    }

    const reaction = {
        schedule,
        dependencies: new Set<Set<Schedule>>(),
    };

    return { track };
}

function flush(fn: () => void ) {
    if (typeof MessageChannel !== undefined) {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = fn;
        port2.postMessage(null);
    } else {
        setTimeout(fn);
    }
}

type ReturnReaction = ReturnType<typeof createReaction>;
type ReactionCall<T> = (signal: T) => void;

export function useReaction<T>(fn: () => T, reaction?: ReactionCall<T>): T {
    const [, forceUpdate] = useState({});
    const queue = useRef<number>(0);
    const reactionCall = useRef<ReactionCall<T> | undefined>(reaction);
    const reactionTrackingRef = useRef<ReturnReaction | null>(null);

    useEffect(() => {
        reactionCall.current = reaction;
    });

    if (!reactionTrackingRef.current) {
        reactionTrackingRef.current = createReaction(() => {
            queue.current += 1;
            queue.current === 1 && flush(() => {
                queue.current = 0;
                forceUpdate({});
                reactionCall.current?.(fn());
            })
        });
    }

    const { track } = reactionTrackingRef.current;

    let rendering!: T;
    let exception;
    track(() => {
        try {
            rendering = fn();
        } catch (e) {
            exception = e;
        }
    });

    if (exception) {
        throw exception; // re-throw any exceptions caught during rendering
    }

    return rendering;
}

export function useOnlyRun<T>(fn: () => T, reaction?: ReactionCall<T>): T {
    const queue = useRef<number>(0);
    const reactionCall = useRef<ReactionCall<T> | undefined>(reaction);
    const reactionTrackingRef = useRef<ReturnReaction | null>(null);

    useEffect(() => {
        reactionCall.current = reaction;
    });

    if (!reactionTrackingRef.current) {
        reactionTrackingRef.current = createReaction(() => {
            queue.current += 1;
            queue.current === 1 && flush(() => {
                queue.current = 0;
                reactionCall.current?.(fn());
            })
        });
    }

    const { track } = reactionTrackingRef.current;

    let rendering!: T;
    let exception;
    track(() => {
        try {
            rendering = fn();
        } catch (e) {
            exception = e;
        }
    });

    if (exception) {
        throw exception; // re-throw any exceptions caught during rendering
    }

    return rendering;
}

export function useSignal<T>(signal:T): [() => T, SetterOrUpdater<SetValueType<T>>] {
  const [[read, write]] = useState(() => createSignal<T>(signal));
  return [read, write];
}
