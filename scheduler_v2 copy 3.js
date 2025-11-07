const S = {
    no_op: () => { },
    tasks: {},
    tags: {},
    current: 1,
    dummy: [],
    // activeTasks was also removed as it was redundant
    activeIndex: 0,
    dispatcher: {
        get 1() {
            const nodeToRun = S.tasks[S.current][S.activeIndex];
            const tag = nodeToRun[1];

            // --- KEY CHANGE #1 ---
            // taskId is now at index 2.
            const taskId = nodeToRun[2];

            const tagData = S.tags[tag];
            const tickDataForTag = [S.dummy, tagData][+!!tagData][S.current];
            const isTaskValid = +!!([S.dummy, tickDataForTag][+!!tickDataForTag][taskId]);
            [S.no_op, nodeToRun[0]][isTaskValid]();
            S.activeIndex++;
            S.dispatcher[+(S.activeIndex < S.tasks[S.current].length)];
        }
    },

    run(task, delay, tag) {
        const effectiveDelay = [1, delay][+!!delay];
        tag = ["_chmod_", tag][+!!tag];
        const targetTick = S.current + effectiveDelay;
        S.tasks[targetTick] = [[], S.tasks[targetTick]][+!!S.tasks[targetTick]];
        const tickTasks = S.tasks[targetTick];
        const taskIdWithinTick = tickTasks.length;
        const schedulerNode = [task, tag, taskIdWithinTick];
        tickTasks[tickTasks.length] = schedulerNode;
        S.tags[tag] = [{}, S.tags[tag]][+!!S.tags[tag]];
        S.tags[tag][targetTick] = [[], S.tags[tag][targetTick]][+!!S.tags[tag][targetTick]];
        S.tags[tag][targetTick][taskIdWithinTick] = true;
        ({ get 1() { task(); schedulerNode[0] = S.no_op; } })[+(delay === 0)];
    }
};

const tick = () => {
    S.tasks[S.current] = [[], S.tasks[S.current]][+!!S.tasks[S.current]];
    S.activeIndex = 0;
    S.dispatcher[+(S.tasks[S.current].length > 0)];
    delete S.tasks[S.current++];
};