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


repeat = (task, interval, tag) => {
    const intervalId = nextIntervalId++;
    const intervalHandle = { task: task };
    activeIntervals[intervalId] = { handle: intervalHandle };

    const repeater = () => {
        const intervalData = activeIntervals[intervalId];
        if (!intervalData) return;
        intervalData.handle.task();
        const targetTick = currentTick + interval;
        const schedulerNode = {
            task: repeater,
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
    };
    const intervalTagNode = {
        type: 'repeat',
        handle: intervalHandle,
        intervalId: intervalId,
        next: tasksByTag[tag]
    };
    tasksByTag[tag] = intervalTagNode;

    const firstTargetTick = currentTick + interval;
    const firstSchedulerNode = {
        task: repeater,
        next: taskHeads[firstTargetTick],
        tag: tag
    };
    taskHeads[firstTargetTick] = firstSchedulerNode;
    const firstTagNode = {
        type: 'run',
        handle: firstSchedulerNode,
        next: tasksByTag[tag]
    };
    tasksByTag[tag] = firstTagNode;

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

    const delay = 0;
    const clearingJobTag = "";
    const targetTick = currentTick + delay;
    const schedulerNode = {
        task: clearingJob,
        next: taskHeads[targetTick],
        tag: clearingJobTag
    };
    taskHeads[targetTick] = schedulerNode;
    const tagNode = {
        type: 'run',
        handle: schedulerNode,
        next: tasksByTag[clearingJobTag]
    };
    tasksByTag[clearingJobTag] = tagNode;
};

tick = () => {
    for (
        let currentNode = taskHeads[currentTick];
        currentNode;
        currentNode = currentNode.next
    ) currentNode.task();
    delete taskHeads[currentTick++];
};