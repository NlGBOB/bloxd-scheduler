taskHeads = {};
currentTick = 0;
nextIntervalId = 1;
activeIntervals = {};
tasksByTag = {};


run = (task, delay, tag) => {
    const targetTick = currentTick + delay;

    const schedulerNode = {
        task: task,
        next: taskHeads[targetTick],
        tag: tag
    };
    taskHeads[targetTick] = schedulerNode;

    const tagNode = {
        type: 'run',
        handle: schedulerNode,
        next: tasksByTag[tag]
    };
    tasksByTag[tag] = tagNode;

    return targetTick;
};

runWhile = (task, delay, step, tag, onComplete) => {
    const sequenceStepRunner = () => {
        if (conditional()) {
            task();
            run(sequenceStepRunner, step, tag);
        } else {
            run(onComplete, 1, tag);
        }
    };
    run(sequenceStepRunner, delay, tag);
};

repeat = (task, interval, tag) => {
    const intervalId = nextIntervalId++;
    const intervalHandle = { task: task };
    activeIntervals[intervalId] = { handle: intervalHandle };

    const repeater = () => {
        const intervalData = activeIntervals[intervalId];
        if (!intervalData) return;
        intervalData.handle.task();
        run(repeater, interval, tag);
    };
    const intervalTagNode = {
        type: 'repeat',
        handle: intervalHandle,
        intervalId: intervalId,
        next: tasksByTag[tag]
    };
    tasksByTag[tag] = intervalTagNode;

    run(repeater, interval, tag);

    return { intervalId };
};


clearTick = (tickToClear) => {
    delete taskHeads[tickToClear];
};

clearRepeat = (intervalId) => {
    delete activeIntervals[intervalId];
};

clearByTag = (tag) => {
    const clearingJob = () => {
        for (
            let currentTagNode = tasksByTag[tag];
            currentTagNode;
            currentTagNode = currentTagNode.next
        ) {
            currentTagNode.handle.task = () => { };
            delete activeIntervals[currentTagNode.intervalId];
        }
        delete tasksByTag[tag];
    };

    run(clearingJob, 0, "");
};


sequence = (jobs, delay, step, tag, onComplete) => {
    const scheduleNextJob = (index) => {
        if (!jobs || index >= jobs.length) {
            run(onComplete, 1, tag);
            return;
        }
        const taskToRun = jobs[index];
        const jobRunner = () => {
            taskToRun();
            run(() => scheduleNextJob(index + 1), step, tag);
        };
        run(jobRunner, 1, tag);
    };

    run(() => scheduleNextJob(0), delay, tag);
};

tick = () => {
    for (
        let currentNode = taskHeads[currentTick];
        currentNode;
        currentNode = currentNode.next
    ) currentNode.task();
    delete taskHeads[currentTick++];
};