S = {
    tasks: {},
    tags: {},
    current: 0,
    processing: [][0],
    currentTickList: [][0],
    dispatcher: {
        get 1() {
            let nodeToRun = S.currentTickList[0],
                tag = nodeToRun[1],
                tagList = S.tags[tag],
                prevTag = nodeToRun[4],
                list = [[], tagList][+!!tagList];
            nodeToRun[0]();
            [[], S.currentTickList[0] = nodeToRun[3]][+!!S.currentTickList[0]][2] = [][0];
            list[0] = [list[0], [[], prevTag][+!!prevTag][5] = nodeToRun[5]][+(list[0] === nodeToRun)];
            list[1] = [list[1], [[], nodeToRun[5]][+!!nodeToRun[5]][4] = prevTag][+(list[1] === nodeToRun)];
            ({ get 1() { delete S.tags[tag]; } })[+!!tagList & +!list[0]];
            S.dispatcher[+!!S.currentTickList[0]];
        }
    },

    canceller: {
        tagsToClear: [][0],
        tagIndex: 0,
        currentNode: [][0],
        currentTag: [][0],
        get 1() {
            let tagList = S.tags[S.canceller.currentTag = S.canceller.tagsToClear[S.canceller.tagIndex]];
            S.canceller.currentNode = [, [[], tagList][+!!tagList][0]][+!!tagList & +!![[], tagList][+!!tagList][0]];
            S.canceller[3 - +!!S.canceller.currentNode]
        },
        get 2() {
            S.canceller.currentNode[0] = () => { };
            S.canceller[3 - +!!(S.canceller.currentNode = S.canceller.currentNode[5])]
        },
        get 3() {
            ({ get 1() { delete S.tags[S.canceller.currentTag]; } })[+!!S.tags[S.canceller.currentTag]];
            S.canceller[[4, 1][+(++S.canceller.tagIndex < S.canceller.tagsToClear.length)]]
        },
        get 4() {
            S.canceller.tagsToClear = [][0];
        }
    },
    run(task, delay, tag) {
        let effectiveTag = ["__run", tag][+!!tag],
            targetTick = S.current + [0, delay][+!!delay] + (+!!S.processing & +(S.current + [0, delay][+!!delay] === S.processing)),
            tasksList = S.tasks[targetTick] = [[], S.tasks[targetTick]][+!!S.tasks[targetTick]],
            tagsList = S.tags[effectiveTag] = [[], S.tags[effectiveTag]][+!!S.tags[effectiveTag]],
            oldTickTail = tasksList[1], oldTagTail = tagsList[1],
            schedulerNode = [task, effectiveTag, oldTickTail, , oldTagTail, , targetTick];
        tasksList[1] = tagsList[1] = [[], oldTickTail][+!!oldTickTail][3] = [[], oldTagTail][+!!oldTagTail][5] = schedulerNode;
        tasksList[0] = [tasksList[0], schedulerNode][+!oldTickTail];
        tagsList[0] = [tagsList[0], schedulerNode][+!oldTagTail];
    },
    chain(tasks, step, tag, onComplete) {
        let effectiveStep = [1, step][+!!step],
            effectiveTag = ["__chain", tag][+!!tag],
            effectiveOnComplete = [() => { }, onComplete][+!!onComplete],
            currentIndex = 0;
        (function runner() {
            [
                () => S.run(effectiveOnComplete),
                () => {
                    tasks[currentIndex++]();
                    S.run(runner, effectiveStep, effectiveTag);
                }
            ][+(currentIndex < tasks.length)]();
        })();
    },
    repeatWhile(task, step, tag, conditional, onComplete) {
        let effectiveStep = [20, step][+!!step],
            effectiveTag = ["__repeatWhile", tag][+!!tag],
            effectiveOnComplete = [() => { }, onComplete][+!!onComplete];
        (function repeater() {
            [
                () => S.run(effectiveOnComplete),
                () => {
                    task();
                    S.run(repeater, effectiveStep, effectiveTag);
                }
            ][+conditional()]();
        })();
    },
    repeat(task, step, tag) {
        let effectiveStep = [20, step][+!!step],
            effectiveTag = ["__repeat", tag][+!!tag];
        (function repeater() {
            task();
            S.run(repeater, effectiveStep, effectiveTag);
        })();
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
    S.dispatcher[+!!([[], S.currentTickList][+!!S.currentTickList][0])];
    delete S.tasks[S.current];
    S.current++;
    S.processing = [][0];
};