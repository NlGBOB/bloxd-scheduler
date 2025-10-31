S = {
    tasks: {},
    current: 0,
    processing: null,
    dummy: [],
    currentTickList: null,
    dispatcher: {
        get 1() {
            S.currentTickList[0][0]();
            S.currentTickList[0] = S.currentTickList[0][3];
            S.dispatcher[+!!S.currentTickList[0]];
        }
    },
    clearer: {
        tagsToClear: null,
        tickList: null,
        prev: null,
        current: null,
        get 1() {
            const next = S.clearer.current[3];
            const shouldRemove = +!!S.clearer.tagsToClear.includes(S.clearer.current[1]);
            const isTail = +(S.clearer.tickList[1] === S.clearer.current);
            const removingTheTail = isTail & shouldRemove;
            S.clearer.prev[3] = [S.clearer.prev[3], next][shouldRemove];
            S.clearer.prev = [S.clearer.current, S.clearer.prev][shouldRemove];
            S.clearer.tickList[1] = [S.clearer.tickList[1], S.clearer.prev][removingTheTail];
            S.clearer.current = next;
            S.clearer[+!!S.clearer.current];
        }
    },
    run(task, delay, tag) {
        const effectiveDelay = [0, delay][+!!delay];
        const effectiveTag = ["__run", tag][+!!tag];
        let targetTick = S.current + effectiveDelay;
        const isProcessing = +!!(S.processing !== null);
        const isSameTick = +(targetTick === S.processing);
        const isSchedulingForCurrentExecutingTick = isProcessing & isSameTick;
        targetTick = targetTick + isSchedulingForCurrentExecutingTick;
        S.tasks[targetTick] = [[null, null], S.tasks[targetTick]][+!!S.tasks[targetTick]];
        const oldTail = S.tasks[targetTick][1];
        const schedulerNode = [task, effectiveTag, oldTail, null];
        [S.dummy, oldTail][+!!oldTail][3] = schedulerNode;
        S.tasks[targetTick][0] = [schedulerNode, S.tasks[targetTick][0]][+!!S.tasks[targetTick][0]];
        S.tasks[targetTick][1] = schedulerNode;
    },
    while(task, conditional, step, tag, onComplete) {
        const effectiveConditional = [() => { return false }, conditional][+!!conditional];
        const effectiveStep = [20, step][+!!step];
        const effectiveTag = ["__while", tag][+!!tag];
        const effectiveOnComplete = [() => { }, onComplete][+!!onComplete];
        const stepRunner = () => {
            if (effectiveConditional()) {
                task();
                S.run(stepRunner, effectiveStep, effectiveTag);
            } else S.run(effectiveOnComplete, 1, effectiveTag);
        }
        stepRunner();
    },
    repeat(task, step, tag) {
        const effectiveStep = [20, step][+!!step];
        const effectiveTag = ["__repeat", tag][+!!tag];
        const repeater = () => {
            task();
            S.run(repeater, effectiveStep, effectiveTag);
        };
        repeater();
    },
    cancel(tags) {
        S.clearer.tagsToClear = [tags, [tags]][+!Array.isArray(tags)];
        Object.keys(S.tasks).forEach(tickKey => {
            const tickList = S.tasks[tickKey];
            const dummy = [null, '__dummy', null, tickList[0]];
            S.clearer.tickList = tickList;
            S.clearer.prev = dummy;
            S.clearer.current = tickList[0];
            S.clearer[+!!S.clearer.current];
            tickList[0] = dummy[3];
            const tailIsDummy = +(tickList[1] === dummy);
            tickList[1] = [tickList[1], null][tailIsDummy];
            const listIsEmpty = +!tickList[0];
            ({ get 1() { delete S.tasks[tickKey]; } })[listIsEmpty];
        });
    }
};

tick = () => {
    S.processing = S.current;
    S.currentTickList = S.tasks[S.current];
    S.dispatcher[+!!([S.dummy, S.currentTickList][+!!S.currentTickList][0])];
    delete S.tasks[S.current];
    S.current++;
    S.processing = null;
};