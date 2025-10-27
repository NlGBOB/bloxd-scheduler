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
        handle: schedulerNode,
        next: tasksByTag[tag]
    };
    tasksByTag[tag] = tagNode;
};


runWhile = (task, conditional, step, tag, onComplete) => {
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
    tasksByTag[tag] = { handle, next: tasksByTag[tag] }
    repeater();
};


clearByTag = (tag) => {
    for (
        let currentTagNode = tasksByTag[tag];
        currentTagNode;
        currentTagNode = currentTagNode.next
    ) currentTagNode.handle.task = () => { };
    delete tasksByTag[tag];
};

sequence = (tasks, step, tag, onComplete) => {
    let index = 0;
    const runNextJob = () => {
        tasks[index]();
        if (index + 1 < tasks.length) {
            index++;
            run(runNextJob, step, tag)
        } else run(onComplete, 1, tag)
    }
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