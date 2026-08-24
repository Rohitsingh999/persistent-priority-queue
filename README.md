# Persistent Priority Queue

A simple persistent priority queue implementation in JavaScript using binary heaps.

The queue supports both minimum and maximum priority operations and stores its state in a JSON file so that the data is available even after restarting the application.

## Project Structure

```text
persistent-priority-queue/
├── module.js
├── test.js
├── README.md
└── data/
    └── queue.json




               Implementation
The implementation uses a dual-heap approach with two synchronized binary heaps:

Min-heap: Extracts lowest priority items

Max-heap: Extracts highest priority items

Index Map: Tracks item positions for O(log n) updates and deletions

Sequence Numbers: Ensure FIFO ordering for equal priorities


             Priority Queue
                  |
          +-------+-------+
          |               |
       Min Heap        Max Heap
          |               |
     Lowest first     Highest first

The min-heap is used for extract_min() and the max-heap is used for extract_max().

Both heaps contain the same logical queue items.

When an item is inserted, updated, or deleted, both heaps are updated so they remain synchronized.


| Operation   | Complexity |
| ----------- | ---------- |
| insert      | O(log n)   |
| peek        | O(1)       |
| extract_min | O(log n)   |
| extract_max | O(log n)   |
| update      | O(log n)   |
| delete      | O(log n)   |
| is_empty    | O(1)       |




Key Design Decisions

Feature	Implementation	Benefit
Data Structure	Binary Heap with Index Map	O(log n) for all operations
Persistence	Atomic file writes (write-then-rename)	Prevents corruption
Tie-breaking	Sequence numbers	Deterministic ordering


Item Structure
javascript
{
    id: '550e8400-e29b-41d4-a716-446655440000',
    value: 'Send email',
    priority: 30,
    sequence: 1  // Auto-incrementing for tie-breaking
}


Real-World Use Cases
1. Task Scheduling Systems

2. Healthcare Patient Triage

3. Network Traffic Management

4. Event Processing System

```
