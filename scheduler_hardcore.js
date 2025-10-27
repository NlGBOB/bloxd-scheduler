// --- Global State ---
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

runWhile = (conditional, task, delay, step, tag, onComplete) => {
    const sequenceStepRunner = () => {
        if (conditional()) {
            task();
            // --- INLINED run(sequenceStepRunner, step, tag) ---
            const nextTargetTick = currentTick + step;
            const schedulerNode = {
                task: sequenceStepRunner,
                next: taskHeads[nextTargetTick],
                tag: tag
            };
            taskHeads[nextTargetTick] = schedulerNode;

            const tagNode = {
                type: 'run',
                handle: schedulerNode,
                next: tasksByTag[tag]
            };
            tasksByTag[tag] = tagNode;
            // --- END INLINE ---

        } else {
            // --- INLINED run(onComplete, 1, tag) ---
            const completeTargetTick = currentTick + 1;
            const schedulerNode = {
                task: onComplete,
                next: taskHeads[completeTargetTick],
                tag: tag
            };
            taskHeads[completeTargetTick] = schedulerNode;

            const tagNode = {
                type: 'run',
                handle: schedulerNode,
                next: tasksByTag[tag]
            };
            tasksByTag[tag] = tagNode;
            // --- END INLINE ---
        }
    };

    // --- INLINED initial run(sequenceStepRunner, delay, tag) ---
    const initialTargetTick = currentTick + delay;
    const initialSchedulerNode = {
        task: sequenceStepRunner,
        next: taskHeads[initialTargetTick],
        tag: tag
    };
    taskHeads[initialTargetTick] = initialSchedulerNode;

    const initialTagNode = {
        type: 'run',
        handle: initialSchedulerNode,
        next: tasksByTag[tag]
    };
    tasksByTag[tag] = initialTagNode;
    // --- END INLINE ---
};

repeat = (task, interval, tag) => {
    const intervalId = nextIntervalId++;
    const intervalHandle = { task: task };
    activeIntervals[intervalId] = { handle: intervalHandle };

    const repeater = () => {
        const intervalData = activeIntervals[intervalId];
        if (!intervalData) return;
        intervalData.handle.task();

        // --- INLINED run(repeater, interval, tag) ---
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
        // --- END INLINE ---
    };

    // Create the tag node for the interval itself, used for clearing.
    const intervalTagNode = {
        type: 'repeat',
        handle: intervalHandle,
        intervalId: intervalId,
        next: tasksByTag[tag]
    };
    tasksByTag[tag] = intervalTagNode;

    // --- INLINED first run(repeater, interval, tag) ---
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
    // --- END INLINE ---

    return { intervalId };
};

/**
 * MODIFIED: Inlined 'run' calls.
 */
sequence = (jobs, delay, step, tag, onComplete) => {
    const scheduleNextJob = (index) => {
        if (!jobs || index >= jobs.length) {
            if (onComplete) {
                // --- INLINED run(onComplete, 1, tag) ---
                const targetTick = currentTick + 1;
                const schedulerNode = {
                    task: onComplete,
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
                // --- END INLINE ---
            }
            return;
        }

        const taskToRun = jobs[index];
        const jobRunner = () => {
            taskToRun();

            // --- INLINED run(() => scheduleNextJob(index + 1), step, tag) ---
            const targetTick = currentTick + step;
            const schedulerNode = {
                task: () => scheduleNextJob(index + 1),
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
            // --- END INLINE ---
        };

        // --- INLINED run(jobRunner, 1, tag) ---
        const targetTick = currentTick + 1;
        const schedulerNode = {
            task: jobRunner,
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
        // --- END INLINE ---
    };

    // --- INLINED run(() => scheduleNextJob(0), delay, tag) to kick off the sequence ---
    const targetTick = currentTick + delay;
    const schedulerNode = {
        task: () => scheduleNextJob(0),
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
    // --- END INLINE ---
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
};



tick = () => {
    const head = taskHeads[currentTick];
    if (head) {
        for (
            let currentNode = head;
            currentNode;
            currentNode = currentNode.next
        ) {
            currentNode.task();
        }
    }
    delete taskHeads[currentTick++];
};