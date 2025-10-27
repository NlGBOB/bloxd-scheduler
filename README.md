# Bloxd scheduler for Game Makers

This task scheduler is different from traditional implementations. It's short, interruption-safe, and packed with **unique features for gamemakers**. It supports scheduling complex sequences, repeating tasks, and conditional loops, all with minimal performance impact on Bloxd’s interruption counter.

## API At a Glance
The `tag` parameter in these functions is an important feature: it's a string you assign to identify a specific task or group of tasks, which allows you to cancel them later using `clearByTag()`. This is especially useful for managing game events that may need to be stopped mid-execution. For example, infinitely repeating tasks or events tied to a temporary game state.

For instance, imagine you have a minigame called **"Sokoban"** and you’ve scheduled several tasks related to it (animations, timers, event checks, etc.) to run in the future. If the players complete the minigame earlier than expected, you can simply use `clearByTag("sokoban")` to cancel all pending tasks associated with it. This ensures that no leftover events interfere with your game's flow, and you’re free to start scheduling tasks for the next minigame immediately.

A quick note on parameters: The number of parameters for every function is **strict**. This is a deliberate design choice to maximize performance, as adding default values would increase the interrupt counter. If a function's signature includes a parameter, you must provide it.
-   **To run a task immediately**, pass `0` for the `delay`.
-   **If you don't need a tag for cancellation**, pass an empty string (`''`) for the `tag`.

---

-   **`run(task, delay, tag)`**
    A `setTimeout` alternative. Schedules a function to run once after a delay. The `tag` lets you cancel it.

-   **`start(task)`**
    Safely initializes complex schedulers like `runWhile` or `sequence` to run on the current tick.

-   **`runWhile(task, conditional, step, tag, onComplete)`**
    Repeatedly runs a task as long as a condition is true. The `tag` is required to provide a reliable way to cancel the loop, if the conditional never becomes false.

-   **`repeat(task, interval, tag)`**
    A `setInterval` alternative. Runs a task indefinitely at a fixed interval. The `tag` is required to stop the repetition.

-   **`sequence(tasks, step, tag, onComplete)`**
    Executes an array of tasks in order. The `tag` is required to cancel the entire sequence of tasks midway through.

-   **`clearByTag(tag)`**
    Cancels any and all scheduled tasks associated with a given `tag`.

-   **Low-Level Scheduling**
    A direct, zero-interruption method for scheduling simple, un-cancellable tasks.

---
## Unmatched Performance

This scheduler is likely as efficient as it can get within the Bloxd engine, for two key reasons:

1.  **Nearly Zero-Cost Idle Ticks:** The scheduler is driven by a `tick()` function, called by the game ~20 times per second. Thanks to its underlying linked-list structure, a `tick()` call where no tasks are scheduled for that moment is incredibly cheap, **increasing the game's interrupt counter by just one**. Other (not all) implementations often rely on loops that must run on every tick, regardless of whether there is work to do.

2.  **Atomic Scheduling:** The primary scheduling function, `run()`, is nearly **atomic**. It simply adds a task to a map, an uninterruptible operation. The only cost is the function call to `run` itself - just a single interruption point.

## Core Concepts: The Tick & Linked List Efficiency
The game engine calls the `tick()` function to advance the scheduler's internal clock (`currentTick`).

```javascript
tick = () => {
    // 1. A single, cheap lookup. If false, the loop is skipped.
    while (taskHeads[currentTick]) {
        const headNode = taskHeads[currentTick];
        headNode.task();
        taskHeads[currentTick] = headNode.next;
    }
    // 2. Cleanup and increment.
    delete taskHeads[currentTick++];
};
```
When `tick()` is called, it does a direct lookup for `taskHeads[currentTick]`. If no tasks are scheduled for that tick, the `while` loop is skipped entirely, making idle ticks incredibly cheap.

---

## API Reference

### `run(task, delay, tag)`

Schedules a task to be executed once after a specified delay. This is the primary, low-interruption function for scheduling work.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute. |
| `delay` | `Number` | The number of ticks to wait before executing (use `0` for immediate). |
| `tag` | `String` | A tag used for cancellation (use `''` if not needed). |

**Example:**
```javascript
// Throw a bomb that explodes in 30 ticks.
api.log('bomb out!');
run(() => api.log('💥 BOOM!'), 30, 'bomb_1');
```

---
### `start(task)`
Schedules a task to run on the current tick. Its main purpose is to be a safe, readable entry point for starting complex, multi-step schedulers like `runWhile`, `repeat`, or `sequence`.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute, which typically calls another scheduler function. |

**Why use it?** It ensures that your complex schedulers are initialized within the scheduler's own execution flow, which is **much, much safer** than calling them directly from your top-level code. The task only runs *after* it's been already scheduled. If you called the multi-step schedulers directly and they interrupted, they wouldn't be executed again. So use `start()` for complex schedulers. 

---
### `runWhile(task, conditional, step, tag, onComplete)`
Runs a `task` every `step` ticks, as long as the `conditional` function returns `true`.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute on each step. |
| `conditional` | `Function` | A function returning `true` to continue or `false` to stop. |
| `step` | `Number` | The number of ticks between each execution. |
| `tag` | `String` | (Required) A tag for cancellation. |
| `onComplete` | `Function` | A function to run once after the conditional becomes false. |

**Concrete Example: Moving a character to a destination.**
```javascript
let playerPosition = 0;
const targetPosition = 10;
const movePlayerTask = () => { playerPosition++; api.log(`Player moved to position ${playerPosition}`); };
const isPlayerStillMoving = () => playerPosition < targetPosition;
const onArrival = () => api.log(`Player has arrived at position ${targetPosition}!`);

start(() => {
    runWhile(movePlayerTask, isPlayerStillMoving, 5, 'player_movement', onArrival);
});
```

---
### `repeat(task, interval, tag)`
Schedules a task to run repeatedly and indefinitely, with a fixed `interval` between executions.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute repeatedly. |
| `interval` | `Number` | The number of ticks to wait between each execution. |
| `tag` | `String` | (Required) A tag is essential for stopping the repetition. |

**Concrete Example: A repeating leaderboard update.**
Let's say the leaderboard should update every 5 seconds (100 ticks) during a game round.

```javascript
const updateLeaderboard = () => {
    // Logic to fetch scores and display them
    api.log('Leaderboard has been updated!');
};

// Start the repeating task when the game round begins
start(() => {
    repeat(updateLeaderboard, 100, 'leaderboard_updater');
});

// When the round ends, another part of your code is responsible for stopping this task.
const endRound = () => {
    api.log('The round is over! Stopping leaderboard updates.');
    clearByTag('leaderboard_updater');
    // ... other end-of-round logic
};
start(() => {
    endRound() // Notice how we're calling endRound inside "start"?
});
```
---
### `sequence(tasks, step, tag, onComplete)`
Executes an array of `tasks` in order, with a fixed `step` delay between each task.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `tasks` | `Array<Function>` | An array of functions to execute in order. |
| `step` | `Number` | The number of ticks to wait between each task. |
| `tag` | `String` | (Required) A tag for cancellation. |
| `onComplete` | `Function` | A function to run once the entire sequence is finished. |

**Concrete Example: A multi-stage crafting recipe.**
```javascript
const craftArrowSequence = [
    () => api.log('Step 1: Gathering wood...'),
    () => api.log('Step 2: Carving the shaft...'),
    () => api.log('Step 3: Attaching a feather...'),
    () => api.log('Step 4: Tipping with flint...'),
];
const onCraftingComplete = () => {
    api.giveItem(playerId, 'arrow', 1); // suppose playerId is defined
    api.log('Arrow crafted successfully!');
};
start(() => {
    sequence(craftArrowSequence, 15, 'crafting_arrow', onCraftingComplete);
});
```

---
### `clearByTag(tag)`
Immediately cancels all scheduled tasks (one-off, repeating, or sequences) associated with a given tag.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `tag` | `String` | The tag of the tasks to be cancelled. |

**How it Works:** It replaces the task's function with an empty function (`() => {}`), effectively neutralizing it.

**Example:**
```javascript
run(() => castFireball(), 100, 'long_spell_cast'); // Start casting a long spell.
clearByTag('long_spell_cast'); // The fireball will now never be cast.
```

---
### Low-Level Scheduling (Zero Interruptions)
If you need to schedule a simple, one-off task with absolutely zero function call overhead, you can directly manipulate the `taskHeads` object. This is an uninterruptible operation.

**When to Use:** Only when performance is absolutely critical and you do not need to cancel the one-off task, ever.

```javascript
// Schedules a log to appear 5 ticks from now. Uninterruptible and un-cancellable.
const targetTick = currentTick + 5;
taskHeads[targetTick] = { task: () => api.log("Directly scheduled task!"), next: taskHeads[targetTick] };
```

---
## CRITICAL: Error Handling & Infinite Loops
The scheduler is resilient but not psychic. When `tick()` executes tasks, it processes them one by one.

**The Danger:** If a task throws an error (e.g., accessing `undefined.property`), the task will fail. The scheduler, by design, will not discard the failing task. It will attempt to run it again on the very same tick, causing the game to get **stuck in an infinite loop**.

**The Solution:** Write safe code. For any operation that *might* fail, wrap it in a `try...catch` block.

*   **Why?** A `try...catch` block prevents the error from halting execution. The scheduler will consider the task "successfully executed" and will move on to the next task.
*   **Is `try...catch` expensive?** Not really, it adds `1` to the interrupt counter, but one extra interruption is infinitely better than a frozen game.

**Example of Safe Task Design:**
```javascript
// DANGEROUS - could cause an infinite loop
const unsafeTask = () => someObject.someProperty;

// SAFE - catches the error and prevents a loop
const safeTask = () => {
    try {
        someObject.someProperty;
    } catch (e) {
        api.log('Task failed but we are moving on (or fixing it) Error: ' + e);
    }
};
run(safeTask, 10, 'my_safe_task');
```

---

In summary, this scheduler provides a unique combination of **top-tier performance**, a **rich and expressive API** for handling complex game logic, and a design that emphasizes **safety and readability**.