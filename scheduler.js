taskHeads = {};
tasksByTag = {};
currentTick = 0;

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
};


runWhile = (conditional, task, step, tag, onComplete) => {
    const stepRunner = () => {
        if (conditional()) {
            task();
            run(stepRunner, step, tag);
        } else run(onComplete, 1, tag);
    }
    stepRunner()
};


repeat = (task, interval, tag) => {
    const handle = { task };

    const repeater = () => {
        if (!handle.task) return;
        handle.task();
        run(repeater, interval, tag);
    };

    const tagNode = {
        type: 'repeat',
        handle: handle,
        next: tasksByTag[tag]
    };
    tasksByTag[tag] = tagNode;

    repeater();
};

clearByTag = (tag) => {
    const tagListHead = tasksByTag[tag];
    if (!tagListHead) { return }

    for (
        let currentTagNode = tagListHead;
        currentTagNode;
        currentTagNode = currentTagNode.next
    ) currentTagNode.handle.task = null;

    delete tasksByTag[tag];
};


sequence = (jobs, step, tag, onComplete) => {
    let index = 0;
    const runNextJob = () => {
        jobs[index]();
        if (index + 1 < jobs.length) {
            index++;
            run(runNextJob, step, tag)
        } else run(onComplete, 1, tag)
    };
    runNextJob();
};

tick = () => {
    for (
        let currentNode = taskHeads[currentTick];
        currentNode;
        currentNode = currentNode.next
    ) currentNode.task();
    delete taskHeads[currentTick++];
};