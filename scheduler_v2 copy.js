S = {
    no_op: _ => _,
    tasks: {},
    tags: {},
    current: 1,
    processing: undefined,
    dummy: [],
    currentTickList: undefined,
    dispatcher: {
        get 1() {
            const nodeToRun = S.currentTickList[0];
            const tag = nodeToRun[1];
            const taskId = nodeToRun[3];
            const currentTick = S.processing;
            const tagData = S.tags[tag];
            const tickDataForTag = [S.dummy, tagData][+!!tagData][currentTick];
            const isTaskValid = +!!([S.dummy, tickDataForTag][+!!tickDataForTag][taskId]);
            [S.no_op, nodeToRun[0]][isTaskValid]();
            const nextNodeInTick = nodeToRun[2];
            S.currentTickList[0] = nextNodeInTick;
            S.dispatcher[+!!S.currentTickList[0]];
        }
    },
    run(task, delay, tag) {
        const effectiveDelay = [0, delay][+!!delay];
        const effectiveTag = ["_chmod_", tag][+!!tag];
        let targetTick = S.current + effectiveDelay;
        const isProcessing = +!!S.processing;
        const isSameTick = +(targetTick === S.processing);
        const isSchedulingForCurrentExecutingTick = isProcessing & isSameTick;
        targetTick = targetTick + isSchedulingForCurrentExecutingTick;
        S.tasks[targetTick] = [[undefined, undefined, 0], S.tasks[targetTick]][+!!S.tasks[targetTick]];
        const tickTasks = S.tasks[targetTick];
        const taskIdWithinTick = tickTasks[2];
        const schedulerNode = [task, effectiveTag, undefined, taskIdWithinTick];
        const oldTickTail = tickTasks[1];
        [{}, oldTickTail][+!!oldTickTail][2] = schedulerNode;
        tickTasks[0] = [schedulerNode, tickTasks[0]][+!!tickTasks[0]];
        tickTasks[1] = schedulerNode;
        tickTasks[2]++;
        S.tags[effectiveTag] = [{}, S.tags[effectiveTag]][+!!S.tags[effectiveTag]];
        S.tags[effectiveTag][targetTick] = [{}, S.tags[effectiveTag][targetTick]][+!!S.tags[effectiveTag][targetTick]];
        S.tags[effectiveTag][targetTick][taskIdWithinTick] = 1;
        ({ get 1() { task(); schedulerNode[0] = S.no_op } })[+(effectiveDelay === 0)];
    }
}

tick = () => {
    S.processing = S.current;
    S.currentTickList = S.tasks[S.current];
    S.dispatcher[+!!([S.dummy, S.currentTickList][+!!S.currentTickList][0])];
    delete S.tasks[S.current];
    delete S.tags["_chmod_"]
    S.current++;
    delete S.processing;
};