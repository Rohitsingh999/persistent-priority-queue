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

The queue uses two binary heaps:

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
