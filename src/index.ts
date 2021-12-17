import { useState, useRef } from 'react';

export interface Schedule {
    schedule: () => unknown | void;
    dependencies: Set<Set<Schedule>>;
}

const context: any[] = [];

function subscribe(schedule: Schedule, subscriptions: Set<Schedule>) {
    subscriptions.add(schedule);
    schedule.dependencies.add(subscriptions);
}

export function createSignal<T>(value: T): [() => T, (val: T) => void] {
    const subscriptions = new Set<Schedule>();

    const read = (): T => {
        const schedule = context[context.length - 1];
        if (schedule) subscribe(schedule, subscriptions);
        return value;
    };

    const write = (nextValue: T) => {
        value = nextValue;
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

type ReturnReaction = ReturnType<typeof createReaction>;

export function useReaction<T>(fn: () => T, reaction?: (signal: T) => void): T {
    const [, forceUpdate] = useState({});
    const reactionTrackingRef = useRef<ReturnReaction | null>(null);

    if (!reactionTrackingRef.current) {
        reactionTrackingRef.current = createReaction(() => {
            forceUpdate({});
            reaction?.(fn());
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

export function useSignal<T>(signal:T): [() => T, (value:T) => void] {
  const [[read, write]] = useState(() => createSignal<T>(signal));
  return [read, write];
}
