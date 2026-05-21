export const topics = [
  {
    id: 'arrays',
    name: 'Arrays',
    icon: '⚡',
    color: '#6c63ff',
    questions: 15,
    difficulty: 'Easy',
    concepts: ['Traversal', 'Sliding Window', 'Two Pointers', "Kadane's Algorithm"],
    explanation: `An array is a collection of elements stored at contiguous memory locations. It is the most fundamental data structure in computer science.

Arrays allow random access to elements using an index. The index starts from zero in most programming languages. Accessing any element takes constant time, O of 1.

Arrays are stored in contiguous memory, which means all elements are placed next to each other. This makes traversal very efficient due to cache locality.

Common operations include traversal which is O of n, insertion at end which is O of 1 amortized, insertion at beginning which is O of n, and deletion which is O of n.

The two-pointer technique is very powerful for arrays. You place one pointer at the start and one at the end, then move them towards each other based on conditions.

The sliding window technique helps solve subarray problems efficiently. Instead of nested loops, we maintain a window that expands and contracts.

Kadane's algorithm finds the maximum subarray sum in O of n time. It maintains a running maximum and a global maximum as it traverses the array.

Arrays form the basis of many other data structures like stacks, queues, and hash tables. Mastering arrays is the first step in your DSA journey.`
  },
  {
    id: 'linkedlist',
    name: 'Linked List',
    icon: '🔗',
    color: '#ff6584',
    questions: 12,
    difficulty: 'Easy',
    concepts: ['Singly Linked', 'Doubly Linked', 'Fast/Slow Pointers', 'Reversal'],
    explanation: `A linked list is a linear data structure where elements are not stored in contiguous memory. Each element called a node contains data and a pointer to the next node.

Unlike arrays, linked lists do not support random access. To reach the nth element, you must traverse from the head, taking O of n time.

However, insertion and deletion at the beginning of a linked list takes O of 1 time, much faster than arrays.

A singly linked list has nodes that point only to the next node. A doubly linked list has nodes that point to both next and previous nodes.

The fast and slow pointer technique uses two pointers moving at different speeds. If there is a cycle, they will eventually meet.

To reverse a linked list, we maintain three pointers: previous, current, and next. We iteratively reverse the links between nodes.

Linked lists are the foundation for stacks, queues, and hash table chaining. They excel when you need frequent insertions and deletions.`
  },
  {
    id: 'stack',
    name: 'Stack',
    icon: '📚',
    color: '#43e97b',
    questions: 10,
    difficulty: 'Easy',
    concepts: ['LIFO', 'Push/Pop', 'Balanced Parentheses', 'Monotonic Stack'],
    explanation: `A stack is a linear data structure that follows the Last In First Out principle, commonly abbreviated as LIFO. The last element inserted is the first to be removed.

Think of a stack like a pile of plates. You add plates to the top and also remove from the top. You cannot access plates in the middle without removing those above.

The two main operations are push which adds an element to the top, and pop which removes the element from the top. Both operations are O of 1.

Stacks are used to check for balanced parentheses. We push opening brackets and pop when we see a closing bracket. If they match we continue.

The monotonic stack is a powerful technique for problems involving the next greater element or previous smaller element.

Function call management in programming languages uses a call stack. When a function is called a frame is pushed. When it returns the frame is popped.

Expression evaluation, undo operations in text editors, and browser history navigation all use stacks as their underlying data structure.`
  },
  {
    id: 'queue',
    name: 'Queue',
    icon: '🎯',
    color: '#f7971e',
    questions: 10,
    difficulty: 'Easy',
    concepts: ['FIFO', 'Enqueue/Dequeue', 'Circular Queue', 'Priority Queue'],
    explanation: `A queue is a linear data structure that follows the First In First Out principle, commonly abbreviated as FIFO. The first element inserted is the first to be removed.

Think of a queue like a line of people waiting. The person who arrived first gets served first. New people join at the back and leave from the front.

The main operations are enqueue which adds to the rear, and dequeue which removes from the front. Both are O of 1 in a properly implemented queue.

A circular queue reuses empty space from dequeued elements. It uses modular arithmetic to wrap the rear pointer around when it reaches the end of the array.

A priority queue serves elements based on priority rather than insertion order. It is typically implemented using a heap.

Breadth-first search uses a queue to explore nodes level by level. We start with the source, enqueue its neighbors, then process each neighbor similarly.

Queues are essential for handling asynchronous data transfer, like print spoolers, keyboard buffers, and network packet management.`
  },
  {
    id: 'trees',
    name: 'Trees',
    icon: '🌳',
    color: '#6c63ff',
    questions: 18,
    difficulty: 'Medium',
    concepts: ['Binary Tree', 'BST', 'DFS/BFS', 'Balanced Trees'],
    explanation: `A tree is a hierarchical data structure consisting of nodes connected by edges. Unlike arrays and linked lists, trees are non-linear structures.

The topmost node is called the root. Each node can have zero or more child nodes. Nodes with no children are called leaf nodes.

A binary tree is a tree where each node has at most two children, referred to as the left child and right child.

A binary search tree maintains the property that all nodes in the left subtree have values less than the root, and all nodes in the right subtree have values greater.

Inorder traversal of a BST gives elements in sorted order. This is left root right traversal. Preorder is root left right. Postorder is left right root.

Tree height is the number of edges on the longest path from root to a leaf. A balanced BST has height of O of log n.

AVL trees and Red-Black trees are self-balancing BSTs. They maintain balance through rotations after insertions and deletions.

Trees are used for file systems, DOM in web browsers, expression parsing, and decision-making algorithms.`
  },
  {
    id: 'graph',
    name: 'Graph',
    icon: '🕸️',
    color: '#ff6584',
    questions: 15,
    difficulty: 'Hard',
    concepts: ['DFS', 'BFS', 'Dijkstra', 'Topological Sort'],
    explanation: `A graph is a non-linear data structure consisting of vertices and edges that connect pairs of vertices. Graphs are the most versatile data structure.

Graphs can be directed where edges have a direction, or undirected where edges go both ways. They can also be weighted with values on edges.

Depth-first search explores as far as possible along each branch before backtracking. It uses a stack either explicit or through recursion.

Breadth-first search explores all neighbors of a node before moving to their neighbors. It uses a queue and finds the shortest path in unweighted graphs.

Dijkstra's algorithm finds shortest paths from a source to all vertices in a weighted graph with non-negative edges.

A directed acyclic graph or DAG has directed edges and no cycles. Topological sorting orders vertices so that for every directed edge from u to v, u comes before v.

Graphs model social networks, road maps, web pages, dependency resolution, and circuit design.`
  },
  {
    id: 'sorting',
    name: 'Sorting',
    icon: '🔀',
    color: '#43e97b',
    questions: 12,
    difficulty: 'Medium',
    concepts: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Counting Sort'],
    explanation: `Sorting is one of the most fundamental operations in computer science. It arranges elements in a specific order usually ascending or descending.

Bubble sort compares adjacent elements and swaps them if they are in the wrong order. It has O of n squared time complexity.

Selection sort finds the minimum element and places it at the beginning then repeats for the rest of the array.

Insertion sort builds a sorted array one element at a time inserting each new element into its correct position. It works well for nearly sorted data.

Merge sort uses the divide and conquer paradigm. It divides the array in half recursively sorts each half then merges. Time complexity is O of n log n and it is stable.

Quick sort selects a pivot and partitions the array into elements smaller and larger than the pivot. Average case is O of n log n.

Heap sort uses a max heap data structure. Building the heap takes O of n time and each extraction takes O of log n.

Counting sort and radix sort are non-comparison based algorithms that can achieve O of n time for specific types of data.`
  }
];

export const practiceQuestions = {
  arrays: [
    { q: "What is the time complexity of accessing an element in an array by index?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], answer: 2 },
    { q: "Which technique is used to find the maximum subarray sum efficiently?", options: ["Two pointers", "Sliding window", "Kadane's algorithm", "Binary search"], answer: 2 },
    { q: "What is the space complexity of an array of n elements?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 2 },
    { q: "The two-pointer technique is most useful for:", options: ["Searching in unsorted arrays", "Problems on sorted arrays or palindromes", "Graph traversal", "Tree traversal"], answer: 1 },
    { q: "Inserting an element at the beginning of an array takes:", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 2 }
  ],
  linkedlist: [
    { q: "What is the time complexity of inserting at the beginning of a linked list?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], answer: 2 },
    { q: "Floyd's cycle detection algorithm uses:", options: ["One pointer", "Two pointers at different speeds", "Three pointers", "Stack"], answer: 1 },
    { q: "Accessing the nth element of a linked list takes:", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 2 },
    { q: "A doubly linked list node contains:", options: ["Only data", "Data and next pointer", "Data next and previous pointers", "Only pointers"], answer: 2 },
    { q: "To find the middle of a linked list use:", options: ["Sort and pick middle", "Fast and slow pointers", "Count nodes then traverse", "Both B and C"], answer: 3 }
  ],
  stack: [
    { q: "What principle does a stack follow?", options: ["FIFO", "LIFO", "Random access", "Priority based"], answer: 1 },
    { q: "Which is NOT a stack application?", options: ["Balanced parentheses", "Function calls", "BFS traversal", "Undo operations"], answer: 2 },
    { q: "Time complexity of push and pop operations:", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], answer: 2 },
    { q: "A monotonic stack maintains:", options: ["Random order", "Always increasing or decreasing order", "Sorted order", "Insertion order"], answer: 1 },
    { q: "Infix to postfix conversion uses:", options: ["Queue", "Stack", "Array", "Linked list"], answer: 1 }
  ],
  queue: [
    { q: "What principle does a queue follow?", options: ["LIFO", "FIFO", "Random access", "Priority based"], answer: 1 },
    { q: "BFS uses which data structure?", options: ["Stack", "Queue", "Heap", "Tree"], answer: 1 },
    { q: "A circular queue solves:", options: ["Memory overflow", "False overflow in linear queue", "Sorting", "Searching"], answer: 1 },
    { q: "Dequeue removes from:", options: ["Rear", "Front", "Middle", "Random position"], answer: 1 },
    { q: "Priority Queue is typically implemented using:", options: ["Array", "Linked list", "Heap", "Stack"], answer: 2 }
  ],
  trees: [
    { q: "Inorder traversal of a BST gives:", options: ["Reverse sorted", "Sorted order", "Level order", "Random"], answer: 1 },
    { q: "Height of a balanced BST with n nodes:", options: ["O(n)", "O(n²)", "O(log n)", "O(1)"], answer: 2 },
    { q: "Which traversal visits root first?", options: ["Inorder", "Postorder", "Preorder", "Level order"], answer: 2 },
    { q: "A complete binary tree is one where:", options: ["All nodes have 2 children", "All levels fully filled except possibly last", "No node has children", "Root has no parent"], answer: 1 },
    { q: "AVL trees maintain balance by:", options: ["Sorting", "Rotations after insertions and deletions", "Hashing", "Linked list reordering"], answer: 1 }
  ],
  graph: [
    { q: "DFS uses which data structure internally?", options: ["Queue", "Stack", "Heap", "Array"], answer: 1 },
    { q: "Dijkstra's algorithm does NOT work with:", options: ["Positive weights", "Zero weights", "Negative weights", "Integer weights"], answer: 2 },
    { q: "Topological sort is only possible on:", options: ["Undirected graphs", "Directed Acyclic Graphs", "Weighted graphs", "Complete graphs"], answer: 1 },
    { q: "Floyd-Warshall algorithm finds:", options: ["Single source shortest path", "All pairs shortest paths", "Minimum spanning tree", "Connected components"], answer: 1 },
    { q: "BFS gives shortest path in:", options: ["Weighted graphs", "Unweighted graphs", "Negative weight graphs", "DAGs only"], answer: 1 }
  ],
  sorting: [
    { q: "Which sorting algorithm is stable by nature?", options: ["Heap Sort", "Quick Sort", "Merge Sort", "Selection Sort"], answer: 2 },
    { q: "Best case time complexity of Quick Sort:", options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"], answer: 1 },
    { q: "Merge sort space complexity:", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 2 },
    { q: "Counting sort works best when:", options: ["Data is random", "Data has small range of integers", "Data is already sorted", "Data is strings"], answer: 1 },
    { q: "Which algorithm uses divide and conquer?", options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], answer: 2 }
  ]
};