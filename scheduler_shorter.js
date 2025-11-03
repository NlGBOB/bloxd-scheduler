S = {
    tasks: {},
    tags: {},
    current: 1,
    processing: null,
    dummy: [],
    currentTickList: null,
    dispatcher: {
        get 1() {
            const nodeToRun = S.currentTickList[0];
            const tag = nodeToRun[1];
            const tagList = S.tags[tag];
            nodeToRun[0]();
            const nextNodeInTick = nodeToRun[3];
            S.currentTickList[0] = nextNodeInTick;
            [S.dummy, nextNodeInTick][+!!nextNodeInTick][2] = null;
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
        let effectiveDelay = [0, delay][+!!delay],
            effectiveTag = ["__run", tag][+!!tag],
            targetTick = S.current + effectiveDelay + (+!!S.processing & +(S.current + effectiveDelay === S.processing)),
            currentTickList = [[], S.tasks[targetTick]][+!!S.tasks[targetTick]],
            oldTickTail = currentTickList[1],
            currentTagList = [[], S.tags[effectiveTag]][+!!S.tags[effectiveTag]],
            oldTagTail = currentTagList[1],
            schedulerNode = [task, effectiveTag, oldTickTail, , oldTagTail, , targetTick];
        [S.dummy, oldTickTail][+!!oldTickTail][3] = [S.dummy, oldTagTail][+!!oldTagTail][5] = schedulerNode;
        S.tasks[targetTick] = [[schedulerNode, currentTickList[0]][+!!oldTickTail], schedulerNode];
        S.tags[effectiveTag] = [[schedulerNode, currentTagList[0]][+!!oldTagTail], schedulerNode];
    },
    chain(tasks, step, tag, onComplete) {
        const effectiveStep = [1, step][+!!step];
        const effectiveTag = ["__chain", tag][+!!tag];
        const effectiveOnComplete = [() => { }, onComplete][+!!onComplete];
        let currentIndex = 0;
        const runner = () => {
            if (currentIndex < tasks.length) {
                tasks[currentIndex]();
                currentIndex++;
                S.run(runner, effectiveStep, effectiveTag);
            } else S.run(effectiveOnComplete, 1, effectiveTag);
        };
        runner()
    },

    repeatWhile(task, step, tag, conditional, onComplete) {
        const effectiveStep = [1, step][+!!step];
        const effectiveTag = ["__repeatWhile", tag][+!!tag];
        const effectiveOnComplete = [() => { }, onComplete][+!!onComplete];
        const repeater = () => {
            if (conditional()) {
                task();
                S.run(repeater, effectiveStep, effectiveTag);
            } else S.run(effectiveOnComplete, 1, effectiveTag);

        };
        repeater();
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
    S.processing = undefined;
};