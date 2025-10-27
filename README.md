# Simple Tick-Based Task Scheduler

This is a lightweight, in-memory task scheduler for JavaScript. It operates on a concept of "ticks" rather than wall-clock time (`setTimeout`/`setInterval`), making it ideal for simulations, game loops, or any scenario where you need deterministic, step-by-step execution control.

## How It Works: The Core Concepts

The scheduler is built on a few simple ideas:

1.  **The Tick:** The entire system is driven by a global `currentTick` counter. Nothing happens until you manually call the `tick()` function. Each call to `tick()` increments the counter and executes any tasks scheduled for that exact tick.

2.  **Tasks:** A task is simply a JavaScript function you want to execute, like `() => console.log('Hello!')`.

3.  **Tags:** A tag is a string identifier you can assign to a task or a group of related tasks. Tags are powerful because they allow you to cancel many tasks at once using `clearByTag()`.

## Setup

To use the scheduler, simply include the provided code in your project.

```javascript
// Global State
let taskHeads = {};
let tasksByTag = {};
let currentTick = 0;

// ... paste all the scheduler functions here ...
```

---

## API Reference

### `tick()`

This is the engine of the scheduler. You must call it repeatedly in your main loop to advance time and run scheduled tasks.

**When to Use:** In your application's main loop (e.g., a `for` loop for a simulation, or `requestAnimationFrame` for a browser game).

**How it Works:**
It checks if there are any tasks scheduled for the `currentTick`. If so, it executes them one by one. Afterward, it increments `currentTick`.

**Example:**
```javascript
// Schedule a task
run(() => console.log("This will run on tick 5"), 5);

// The main loop
for (let i = 0; i < 10; i++) {
    console.log(`--- Advancing to Tick ${currentTick} ---`);
    tick();
}
// --- Advancing to Tick 0 ---
// --- Advancing to Tick 1 ---
// --- Advancing to Tick 2 ---
// --- Advancing to Tick 3 ---
// --- Advancing to Tick 4 ---
// --- Advancing to Tick 5 ---
// This will run on tick 5
// --- Advancing to Tick 6 ---
// ...
```

---

### `run(task, delay, tag)`

Schedules a task to be executed exactly once, after a specified delay in ticks.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute. |
| `delay` | `Number` | The number of ticks to wait before executing. |
| `tag` | `String` | (Optional) A tag for cancellation. |

**When to Use:** For one-off, fire-and-forget actions that need to happen in the future.

**How it Works:**
It calculates a `targetTick` by adding `delay` to the `currentTick`. It then adds the task to a list of tasks to be executed on that specific target tick.

**Example:**
```javascript
console.log('Scheduling a greeting.');
run(() => console.log('Hello, world!'), 10, 'greeting');

// After 10 calls to tick()...
// > "Hello, world!"
```

---

### `start(task)`

Schedules a task to run as soon as possible within the current tick. This is the **safest way to initiate complex, multi-step schedulers** like `runWhile`, `sequence`, or `repeat`.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute, which often contains calls to other scheduler functions. |

**When to Use:**
Use this to kick off any of the more complex scheduling functions (`runWhile`, `repeat`, `sequence`). It ensures that the initial setup of your complex task happens within the scheduler's controlled execution flow.

**How it Works:**
It's a convenient wrapper for `run(task, 0, '')`. It schedules the task to run on the current tick, but after any tasks that were already in the queue for this tick.

**Best Practice Example:**
```javascript
// CORRECT: Wrap the start of the process in start()
start(() => {
    runWhile(
        () => console.log('Counting down...'),
        () => someCondition,
        10, // step
        'my_countdown',
        () => console.log('Countdown complete!')
    );
});
```

---

### `repeat(task, interval, tag)`

Schedules a task to run repeatedly, with a fixed interval between executions.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute repeatedly. |
| `interval` | `Number` | The number of ticks to wait between each execution. |
| `tag` | `String` | (Required) A tag is essential for being able to stop the repetition. |

**When to Use:** For ongoing background processes, like a character regenerating health every 10 ticks or an animation frame updating.

**How it Works:**
The `repeat` function creates a `repeater` function. When the `repeater` runs, it executes your `task` and then uses `run()` to schedule itself to run again after `interval` ticks. It continues this loop until cancelled via `clearByTag()`.

**Example:**
```javascript
let mana = 50;
start(() => {
    repeat(() => {
        mana += 5;
        console.log(`Mana regenerated. Current mana: ${mana}`);
    }, 20, 'mana_regen');
});

// Let it run for a while... then to stop it:
// clearByTag('mana_regen');
```

---

### `runWhile(task, conditional, step, tag, onComplete)`

Runs a task repeatedly as long as a condition is true. Once the condition becomes false, it runs a final `onComplete` task.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute on each step. |
| `conditional` | `Function` | A function that returns `true` to continue or `false` to stop. |
| `step` | `Number` | The number of ticks between each check and execution. |
| `tag` | `String` | (Required) A tag for cancellation. |
| `onComplete` | `Function` | A function to run once after the conditional becomes false. |

**When to Use:** For processes that have a clear goal or end-state, like a countdown timer, moving an object to a target position, or a loading bar.

**How it Works:**
It creates a `stepRunner` function. The `stepRunner` first checks the `conditional()`. If it's true, it runs your `task` and uses `run()` to schedule itself again. If it's false, it schedules the `onComplete` function to run on the next tick and stops.

**Example:**
```javascript
let countdown = 3;
const isCountingDown = () => countdown > 0;
const countdownTask = () => {
    console.log(`T-minus ${countdown}...`);
    countdown--;
};
const onCompleteTask = () => console.log('Liftoff!');

start(() => {
    runWhile(countdownTask, isCountingDown, 10, 'launch_sequence', onCompleteTask);
});

// After calling tick() 30+ times, the output will be:
// > T-minus 3...
// > T-minus 2...
// > T-minus 1...
// > Liftoff!
```

---

### `sequence(tasks, step, tag, onComplete)`

Executes an array of tasks in order, with a fixed delay between each task.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `tasks` | `Array<Function>` | An array of functions to execute in order. |
| `step` | `Number` | The number of ticks to wait between each task. |
| `tag` | `String` | (Required) A tag for cancellation. |
| `onComplete` | `Function` | A function to run once after the entire sequence is finished. |

**When to Use:** Perfect for scripted events, cinematic cutscenes, or tutorials where actions must happen in a specific, timed order.

**How it Works:**
It keeps track of the current `index` in the `tasks` array. It runs the task at the current index, and if it's not the last task, it uses `run()` to schedule its own next step. When all tasks are done, it schedules `onComplete`.

**Example:**
```javascript
const introSequence = [
    () => console.log('Captain: All systems check.'),
    () => console.log('Computer: Navigation... online.'),
    () => console.log('Computer: Life support... online.'),
    () => console.log('Captain: Engage engines.'),
];

start(() => {
    sequence(introSequence, 15, 'intro_cutscene', () => console.log('Intro Complete!'));
});
```

---

### `clearByTag(tag)`

Immediately cancels all scheduled tasks associated with a given tag.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `tag` | `String` | The tag of the tasks to be cancelled. |

**When to Use:** To stop a `repeat` loop, interrupt a `runWhile` or `sequence`, or prevent a delayed `run` task from ever executing.

**How it Works:**
It finds all handles associated with the tag. For `run`, `runWhile`, and `sequence`, it replaces the `task` function with an empty one, effectively making it a no-op. For `repeat`, it sets a `cancelled = true` flag on the handle, which the `repeater` function checks before re-scheduling itself.

**Example:**
```javascript
// Start a repeating sound effect
start(() => {
    repeat(() => console.log('...drip...'), 30, 'leaky_faucet');
});

// After some time, the player fixes the faucet.
console.log('Player uses wrench.');
clearByTag('leaky_faucet');
// The '...drip...' messages will stop.
```