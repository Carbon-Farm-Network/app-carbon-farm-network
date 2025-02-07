import { Signal } from 'signal-polyfill';

let needsEnque = true;

const w = new Signal.subtle.Watcher(() => {
    if (needsEnque) {
        needsEnque = false;
        queueMicrotask(processPending);
    }
})

function processPending() {
    needsEnque = true;
    
    for (const s of w.getPending()) {
        s.get();
    }

    w.watch();
}

export function effect(callback) {
    let cleanup;

    const computed = new Signal.Computed(() => {
        cleanup?.();
        cleanup = callback();
    });

    w.watch(computed);
    computed.get();

    return () => {
        w.unwatch(computed);
        typeof cleanup === 'function' && cleanup();
    };
}