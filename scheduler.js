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
            const prevTag = nodeToRun[4];
            const nextTag = nodeToRun[5];
            [S.dummy, prevTag][+!!prevTag][5] = nextTag;
            [S.dummy, nextTag][+!!nextTag][4] = prevTag;
            const isTagHead = +(tagList[0] === nodeToRun);
            tagList[0] = [tagList[0], nextTag][isTagHead];
            const isTagTail = +(tagList[1] === nodeToRun);
            tagList[1] = [tagList[1], prevTag][isTagTail];
            const tagListIsEmpty = +!tagList[0];
            ({ get 1() { delete S.tags[tag]; } })[tagListIsEmpty];
            S.currentTickList[0] = nodeToRun[3];
            S.dispatcher[+!!S.currentTickList[0]];
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
        const remover = {
            tagsToClear: [[], tags][+!!tags],
            tagIndex: 0,
            currentNode: null,
            currentTag: null,
            get 1() {
                remover.currentTag = remover.tagsToClear[remover.tagIndex];
                const tagList = S.tags[remover.currentTag];
                const isTagValid = ({ 0: 0, get 1() { return +!!tagList[0] } })[+!!tagList];
                remover.currentNode = [null, tagList[0]][isTagValid];
                remover[2]();
            },
            get 2() {
                const isTagFinished = +!remover.currentNode;
                ({ get 1() { remover[3](); return; } })[isTagFinished];
                remover.currentNode[0] = () => { };
                remover.currentNode = remover.currentNode[5];
                remover[2]();
            },
            get 3() {
                delete S.tags[remover.currentTag];
                remover.tagIndex++;
                const hasMoreTags = +(remover.tagIndex < remover.tagsToClear.length);
                ({ get 1() { remover[1](); } })[hasMoreTags];
            }
        };
        ({ get 1() { remover[1](); } })[+(remover.tagsToClear.length > 0)];
    }
}

tick = () => {
    S.processing = S.current;
    S.currentTickList = S.tasks[S.current];
    S.dispatcher[+!!([S.dummy, S.currentTickList][+!!S.currentTickList][0])];
    delete S.tasks[S.current];
    S.current++;
    S.processing = null;
};