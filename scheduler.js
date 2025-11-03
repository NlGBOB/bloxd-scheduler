S = {
    tasks: {},
    tags: {},
    current: 0,
    processing: null,
    dummy: [],
    currentTickList: null,
    dispatcher: {
        get 1() {
            const nodeToRun = S.currentTickList[0];
            const tag = nodeToRun[1];
            const tagList = S.tags[tag];
            nodeToRun[0]();
            const isTagListValid = +!!tagList;
            const effectiveTagList = [S.dummy, tagList][isTagListValid];
            const prevTag = nodeToRun[4];
            const nextTag = nodeToRun[5];
            [S.dummy, prevTag][+!!prevTag][5] = nextTag;
            [S.dummy, nextTag][+!!nextTag][4] = prevTag;
            const isTagHead = +(effectiveTagList[0] === nodeToRun);
            effectiveTagList[0] = [effectiveTagList[0], nextTag][isTagHead];
            const isTagTail = +(effectiveTagList[1] === nodeToRun);
            effectiveTagList[1] = [effectiveTagList[1], prevTag][isTagTail];
            const tagListIsEmpty = +!effectiveTagList[0];
            ({ get 1() { delete S.tags[tag]; } })[isTagListValid & tagListIsEmpty];
            const nextNodeInTick = nodeToRun[3];
            S.currentTickList[0] = nextNodeInTick;
            [S.dummy, nextNodeInTick][+!!nextNodeInTick][2] = null;
            S.dispatcher[+!!S.currentTickList[0]];
        }
    },
    canceller: {
        tagsToClear: null,
        tagIndex: 0,
        currentNode: null,
        currentTag: null,
        get 1() {
            S.canceller.currentTag = S.canceller.tagsToClear[S.canceller.tagIndex];
            const tagList = S.tags[S.canceller.currentTag];
            const isTagListObjectValid = +!!tagList;
            const effectiveTagList = [S.dummy, tagList][isTagListObjectValid];
            const isHeadValid = +!!effectiveTagList[0];
            const isTagValid = isTagListObjectValid & isHeadValid;
            S.canceller.currentNode = [null, effectiveTagList[0]][isTagValid];
            const nextState = 3 - +!!S.canceller.currentNode;
            S.canceller[nextState];
        },
        get 2() {
            S.canceller.currentNode[0] = () => { };
            S.canceller.currentNode = S.canceller.currentNode[5];
            const nextState = 3 - +!!S.canceller.currentNode;
            S.canceller[nextState];
        },
        get 3() {
            ({ get 1() { delete S.tags[S.canceller.currentTag]; } })[+!!S.tags[S.canceller.currentTag]];
            S.canceller.tagIndex++;
            const hasMoreTags = +(S.canceller.tagIndex < S.canceller.tagsToClear.length);
            const nextState = [4, 1][hasMoreTags];
            S.canceller[nextState];
        },
        get 4() {
            S.canceller.tagsToClear = null;
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
        const schedulerNode = [task, effectiveTag, null, null, null, null, targetTick];
        S.tasks[targetTick] = [[null, null], S.tasks[targetTick]][+!!S.tasks[targetTick]];
        const oldTickTail = S.tasks[targetTick][1];
        schedulerNode[2] = oldTickTail;
        [S.dummy, oldTickTail][+!!oldTickTail][3] = schedulerNode;
        S.tasks[targetTick][0] = [schedulerNode, S.tasks[targetTick][0]][+!!S.tasks[targetTick][0]];
        S.tasks[targetTick][1] = schedulerNode;
        S.tags[effectiveTag] = [[null, null], S.tags[effectiveTag]][+!!S.tags[effectiveTag]];
        const oldTagTail = S.tags[effectiveTag][1];
        schedulerNode[4] = oldTagTail;
        [S.dummy, oldTagTail][+!!oldTagTail][5] = schedulerNode;
        S.tags[effectiveTag][0] = [schedulerNode, S.tags[effectiveTag][0]][+!!S.tags[effectiveTag][0]];
        S.tags[effectiveTag][1] = schedulerNode;
    },

    sequence(tasks, step, tag, onComplete) {
        const effectiveStep = [1, step][+!!step];
        const effectiveTag = ["__sequence", tag][+!!tag];
        const effectiveOnComplete = [() => { }, onComplete][+!!onComplete];
        const hasTasks = +!!(tasks.length > 0);
        ({
            get 1() {
                let currentIndex = 0;
                const runner = () => {
                    if (currentIndex < tasks.length) {
                        tasks[currentIndex]();
                        currentIndex++;
                        S.run(runner, effectiveStep, effectiveTag);
                    } else S.run(effectiveOnComplete, 1, effectiveTag)
                };
                S.run(runner, 0, effectiveTag);
            }
        })[hasTasks];
    },

    repeatWhile(task, step, tag, conditional, onComplete) {
        ({
            get 1() {
                const effectiveStep = [20, step][+!!step];
                const effectiveTag = ["__while", tag][+!!tag];
                const effectiveOnComplete = [() => { }, onComplete][+!!onComplete];

                const stepRunner = () => {
                    if (conditional()) {
                        task();
                        S.run(stepRunner, effectiveStep, effectiveTag);
                    } else S.run(effectiveOnComplete, 1, effectiveTag);
                };
                stepRunner();
            }
        })[+!!conditional];
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
        S.canceller.tagsToClear = [[], tags][+!!tags];
        S.canceller.tagIndex = 0;
        ({ get 1() { S.canceller[1] } })[+(S.canceller.tagsToClear.length > 0)];
    },
}

tick = () => {
    S.processing = S.current;
    S.currentTickList = S.tasks[S.current];
    S.dispatcher[+!!([S.dummy, S.currentTickList][+!!S.currentTickList][0])];
    delete S.tasks[S.current];
    S.current++;
    S.processing = null;
};