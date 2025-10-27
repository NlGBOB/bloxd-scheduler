taskHeads = {};
tasksByTag = {};
currentTick = 0;

run = (task, delay, tag) => {
    const targetTick = currentTick + delay;
    const schedulerNode = { task, tag, next: taskHeads[targetTick] };
    taskHeads[targetTick] = schedulerNode;
    tasksByTag[tag] = { handle: schedulerNode, next: tasksByTag[tag] };
};

start = (task) => {
    const schedulerNode = { task, next: taskHeads[currentTick] };
    taskHeads[currentTick] = schedulerNode;
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
        if (handle.cancelled) return;
        handle.task();
        run(repeater, interval, tag);
    };
    tasksByTag[tag] = { handle, next: tasksByTag[tag] }
    repeater();
};


clearByTag = (tag) => {
    while (tasksByTag[tag]) {
        const handle = tasksByTag[tag].handle;
        handle.cancelled = true;
        handle.task = () => { };
        tasksByTag[tag] = tasksByTag[tag].next;
    }
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
    while (taskHeads[currentTick]) {
        const headNode = taskHeads[currentTick];
        headNode.task();
        taskHeads[currentTick] = headNode.next;
    }
    delete taskHeads[currentTick++];
};