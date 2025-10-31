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
    run(task, delay, tag) {
        const effectiveDelay = [0, delay][+!!delay];
        const effectiveTag = ["", tag][+!!tag];
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