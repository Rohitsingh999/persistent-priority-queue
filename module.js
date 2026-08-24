const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Generic Binary Heap implementation
 * 
 * The comparator function determines the heap type:
 * - Min heap: (a, b) => a.priority - b.priority
 * - Max heap: (a, b) => b.priority - a.priority
 * 
 * Each item must have a unique `id` for the index map to work properly.
 */
class BinaryHeap {
  constructor(comparator) {
    this.heap = [];
    this.comparator = comparator;
    // Keep track of where each item lives in the heap
    this.indexMap = new Map();
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length === 0 ? null : this.heap[0];
  }

  /**
   * Insert a new item into the heap
   * Runtime: O(log n)
   */
  insert(item) {
    const index = this.heap.length;
    this.heap.push(item);
    this.indexMap.set(item.id, index);
    this.bubbleUp(index);
  }

  /**
   * Remove and return the root (min or max depending on comparator)
   * Runtime: O(log n)
   */
  extractRoot() {
    if (this.heap.length === 0) return null;
    
    // Special case: only one element
    if (this.heap.length === 1) {
      const root = this.heap.pop();
      this.indexMap.delete(root.id);
      return root;
    }

    const root = this.heap[0];
    const last = this.heap.pop();
    
    // Remove root from index map
    this.indexMap.delete(root.id);
    
    // Move last element to root position
    this.heap[0] = last;
    this.indexMap.set(last.id, 0);
    
    this.bubbleDown(0);
    return root;
  }

  /**
   * Remove an item by its ID
   * Runtime: O(log n)
   */
  removeById(id) {
    const index = this.indexMap.get(id);
    if (index === undefined) return null;

    const removed = this.heap[index];

    // If it's the last element, just pop it
    if (index === this.heap.length - 1) {
      this.heap.pop();
      this.indexMap.delete(id);
      return removed;
    }

    const last = this.heap.pop();
    this.indexMap.delete(id);
    
    // Move the last element to where the removed item was
    this.heap[index] = last;
    this.indexMap.set(last.id, index);

    // The replacement might need to move up or down
    if (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        this.bubbleUp(index);
        return removed;
      }
    }

    this.bubbleDown(index);
    return removed;
  }

  /**
   * Re-adjust an item's position after its priority changed
   * Runtime: O(log n)
   */
  fix(index) {
    if (index < 0 || index >= this.heap.length) return;

    // Try bubbling up first
    if (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        this.bubbleUp(index);
        return;
      }
    }

    // If it doesn't need to go up, try going down
    this.bubbleDown(index);
  }

  /**
   * Move an element up the heap until it's in the right place
   * Runtime: O(log n)
   */
  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      // If parent already has higher/equal priority, we're done
      if (this.comparator(this.heap[index], this.heap[parentIndex]) >= 0) {
        break;
      }
      
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  /**
   * Move an element down the heap until it's in the right place
   * Runtime: O(log n)
   */
  bubbleDown(index) {
    const length = this.heap.length;

    while (true) {
      const leftIndex = 2 * index + 1;
      const rightIndex = 2 * index + 2;
      let bestIndex = index;

      // Check if left child should come first
      if (
        leftIndex < length &&
        this.comparator(this.heap[leftIndex], this.heap[bestIndex]) < 0
      ) {
        bestIndex = leftIndex;
      }

      // Check if right child should come first
      if (
        rightIndex < length &&
        this.comparator(this.heap[rightIndex], this.heap[bestIndex]) < 0
      ) {
        bestIndex = rightIndex;
      }

      // If current element is already in correct position, we're done
      if (bestIndex === index) break;

      this.swap(index, bestIndex);
      index = bestIndex;
    }
  }

  /**
   * Swap two elements and keep the index map in sync
   * This is critical for the removeById and update operations
   */
  swap(i, j) {
    const itemI = this.heap[i];
    const itemJ = this.heap[j];

    this.heap[i] = itemJ;
    this.heap[j] = itemI;

    // Update positions in the index map
    this.indexMap.set(itemI.id, j);
    this.indexMap.set(itemJ.id, i);
  }

  /**
   * Rebuild the heap from a list of items
   * Used when loading persisted data on startup
   * Runtime: O(n) - bottom-up construction
   */
  build(items) {
    this.heap = [...items];
    this.indexMap.clear();

    // Build the index map
    for (let i = 0; i < this.heap.length; i++) {
      this.indexMap.set(this.heap[i].id, i);
    }

    // Bottom-up heap construction (more efficient than inserting one by one)
    const startIndex = Math.floor(this.heap.length / 2) - 1;
    for (let i = startIndex; i >= 0; i--) {
      this.bubbleDown(i);
    }
  }
}

/**
 * Persistent Priority Queue with both min and max operations
 * 
 * API:
 *   insert(value, priority)
 *   extract_min()
 *   extract_max()
 *   peek()
 *   update(id, newPriority)
 *   delete(id)
 *   is_empty()
 */
class PersistentPriorityQueue {
  constructor(options = {}) {
    this.filePath = options.filePath || path.join(__dirname, "data", "queue.json");

    // Main storage: ID -> item
    this.items = new Map();

    // Min heap - lower priority values come first
    this.minHeap = new BinaryHeap((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Tie-breaker: older sequence number wins
      return a.sequence - b.sequence;
    });

    // Max heap - higher priority values come first
    this.maxHeap = new BinaryHeap((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Same tie-breaking rule for consistency
      return a.sequence - b.sequence;
    });

    // Auto-incrementing sequence for tie-breaking
    this.nextSequence = 1;

    this.initialize();
  }

  /**
   * Set up persistent storage and load any existing data
   */
  initialize() {
    const directory = path.dirname(this.filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // First run - create the file
    if (!fs.existsSync(this.filePath)) {
      this.persist();
      return;
    }

    // Read and parse the file
    let data;
    try {
      data = fs.readFileSync(this.filePath, "utf8");
    } catch (error) {
      throw new Error(`Failed to read queue file: ${error.message}`);
    }

    if (!data.trim()) return;

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (error) {
      throw new Error(`Queue file contains invalid JSON: ${error.message}`);
    }

    if (!Array.isArray(parsed.items)) {
      throw new Error("Invalid queue file: 'items' must be an array.");
    }

    // Restore items and update sequence counter
    for (const item of parsed.items) {
      this.validateStoredItem(item);
      this.items.set(item.id, item);
      if (item.sequence >= this.nextSequence) {
        this.nextSequence = item.sequence + 1;
      }
    }

    // Rebuild both heaps from the restored data
    const items = [...this.items.values()];
    this.minHeap.build(items);
    this.maxHeap.build(items);
  }

  /**
   * Basic validation for items loaded from disk
   */
  validateStoredItem(item) {
    if (
      !item ||
      typeof item.id !== "string" ||
      typeof item.priority !== "number" ||
      !Number.isFinite(item.priority) ||
      typeof item.sequence !== "number"
    ) {
      throw new Error("Invalid item found in persistent queue.");
    }
  }

  /**
   * Check that a priority value is valid
   */
  validatePriority(priority) {
    if (typeof priority !== "number" || !Number.isFinite(priority)) {
      throw new TypeError("Priority must be a finite number.");
    }
  }

  /**
   * Write the current state to disk
   * We store the items map, not the heap structures
   * On startup, heaps are rebuilt from the items
   */
  persist() {
    const data = JSON.stringify(
      {
       
        items: [...this.items.values()],
      },
      null,
      2
    );

    const tempPath = `${this.filePath}.tmp`;

    try {
      // Write to temporary file first to avoid corruption
      fs.writeFileSync(tempPath, data, "utf8");
      // Atomic rename
      fs.renameSync(tempPath, this.filePath);
    } catch (error) {
      // Clean up temp file if something went wrong
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (_) {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to persist queue: ${error.message}`);
    }
  }

  /**
   * Insert a new item with the given priority
   * Runtime: O(log n) in-memory, O(n) for persistence
   */
  insert(value, priority) {
    this.validatePriority(priority);

    const item = {
      id: crypto.randomUUID(),
      value,
      priority,
      sequence: this.nextSequence++,
    };

    // Add to logical storage
    this.items.set(item.id, item);

    // Add to both heaps
    this.minHeap.insert(item);
    this.maxHeap.insert(item);

    // Save to disk
    this.persist();

    // Return a copy to prevent external mutation
    return { ...item };
  }

  /**
   * Get the lowest priority item without removing it
   * Runtime: O(1)
   */
  peek() {
    const item = this.minHeap.peek();
    return item ? { ...item } : null;
  }

  /**
   * Remove and return the lowest priority item
   * Runtime: O(log n)
   */
  extract_min() {
    const item = this.minHeap.extractRoot();
    if (!item) return null;

    // Remove from the other heap
    this.maxHeap.removeById(item.id);
    
    // Remove from logical storage
    this.items.delete(item.id);
    
    this.persist();
    
    return { ...item };
  }

  /**
   * Remove and return the highest priority item
   * Runtime: O(log n)
   */
  extract_max() {
    const item = this.maxHeap.extractRoot();
    if (!item) return null;

    // Remove from the other heap
    this.minHeap.removeById(item.id);
    
    // Remove from logical storage
    this.items.delete(item.id);
    
    this.persist();
    
    return { ...item };
  }

  /**
   * Change an item's priority
   * Runtime: O(log n)
   */
  update(id, newPriority) {
    this.validatePriority(newPriority);

    const item = this.items.get(id);
    if (!item) {
      throw new Error(`Item not found: ${id}`);
    }

    // Get current positions in both heaps
    const minIndex = this.minHeap.indexMap.get(id);
    const maxIndex = this.maxHeap.indexMap.get(id);

    // Update the priority
    item.priority = newPriority;

    // Re-adjust both heaps
    this.minHeap.fix(minIndex);
    this.maxHeap.fix(maxIndex);

    this.persist();
    
    return { ...item };
  }

  /**
   * Remove an item entirely
   * Runtime: O(log n)
   */
  delete(id) {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`Item not found: ${id}`);
    }

    // Remove from both heaps
    this.minHeap.removeById(id);
    this.maxHeap.removeById(id);

    // Remove from logical storage
    this.items.delete(id);

    this.persist();
    
    return { ...item };
  }

  /**
   * Check if the queue is empty
   * Runtime: O(1)
   */
  is_empty() {
    return this.items.size === 0;
  }

  /**
   * Get the current size of the queue
   */
  size() {
    return this.items.size;
  }
}


module.exports = PersistentPriorityQueue;