S = {
    no_op: () => { },
    tasks: {},
    tags: {},
    current: 1,
    opCounter: 0,
    activeIndex: 0,
    dummy: {},
    dispatcher: {
        get 1() {
            const nodeToRun = S.tasks[S.current][S.activeIndex];
            const task = nodeToRun[0];
            const tag = nodeToRun[1];
            const opId = nodeToRun[2];
            const scheduledAt = nodeToRun[3];
            const invalidationPoint = S.tags[tag];
            const hasInvalidationPoint = +!!invalidationPoint;
            const point = [S.dummy, invalidationPoint][hasInvalidationPoint];
            const isInvalidByTick = +(scheduledAt < point[0]);
            const isInvalidById = +(scheduledAt === point[0]) & +(opId < point[1]);
            const isInvalid = hasInvalidationPoint & (isInvalidByTick | isInvalidById);
            [task, S.no_op][isInvalid]();
            S.activeIndex++;
            S.dispatcher[+(S.activeIndex < S.tasks[S.current].length)];
        }
    },

    run(task, delay, tag) {
        const effectiveDelay = [1, delay][+!!delay];
        tag = ["_default_", tag][+!!tag];
        const targetTick = S.current + effectiveDelay;
        S.tasks[targetTick] = [[], S.tasks[targetTick]][+!!S.tasks[targetTick]];
        const tickTasks = S.tasks[targetTick];
        const schedulerNode = [task, tag, S.opCounter, S.current];
        S.opCounter++;
        tickTasks[tickTasks.length] = schedulerNode;
        ({ get 1() { task(); schedulerNode[0] = S.no_op; } })[+(delay === 0)];
    },

    invalidate(tag) {
        S.tags[tag] = [S.current, S.opCounter++];
    }

};

tick = () => {
    S.tasks[S.current] = [[], S.tasks[S.current]][+!!S.tasks[S.current]];
    S.activeIndex = 0;
    S.dispatcher[+(S.tasks[S.current].length > 0)];
    delete S.tasks[S.current++];
    S.opCounter = 0;
};