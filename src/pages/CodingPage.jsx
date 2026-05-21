import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { topics } from '../data/topics';

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

const approachKeywords = {
  arrays: ['array', 'index', 'loop', 'traverse', 'pointer', 'window', 'sliding', 'two pointer', 'subarray'],
  linkedlist: ['node', 'pointer', 'next', 'head', 'tail', 'traverse', 'link', 'slow', 'fast', 'reverse'],
  stack: ['stack', 'push', 'pop', 'lifo', 'top', 'parenthesis', 'bracket', 'monotonic'],
  queue: ['queue', 'fifo', 'enqueue', 'dequeue', 'front', 'rear', 'bfs', 'breadth', 'circular'],
  trees: ['tree', 'node', 'root', 'leaf', 'traversal', 'inorder', 'preorder', 'bst', 'height', 'recursive'],
  graph: ['graph', 'vertex', 'edge', 'dfs', 'bfs', 'visited', 'adjacent', 'cycle', 'path'],
  sorting: ['sort', 'compare', 'swap', 'pivot', 'merge', 'divide', 'conquer', 'partition', 'heap']
};

const starterCodes = {
  arrays: `// Two Sum Problem
function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map[complement] !== undefined) {
      return [map[complement], i];
    }
    map[nums[i]] = i;
  }
}

// Test it
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]`,
  linkedlist: `// Reverse a Linked List
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    let next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
  stack: `// Valid Parentheses
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let ch of s) {
    if ('({['.includes(ch)) stack.push(ch);
    else if (stack.pop() !== map[ch]) return false;
  }
  return stack.length === 0;
}

console.log(isValid("()[]{}")); // true
console.log(isValid("(]"));     // false`,
  queue: `// Implement Queue using two Stacks
class MyQueue {
  constructor() { this.s1 = []; this.s2 = []; }
  push(x) { this.s1.push(x); }
  pop() {
    if (!this.s2.length)
      while (this.s1.length) this.s2.push(this.s1.pop());
    return this.s2.pop();
  }
  peek() {
    if (!this.s2.length)
      while (this.s1.length) this.s2.push(this.s1.pop());
    return this.s2[this.s2.length - 1];
  }
  empty() { return !this.s1.length && !this.s2.length; }
}`,
  trees: `// Maximum Depth of Binary Tree
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
  graph: `// Number of Islands (BFS)
function numIslands(grid) {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j] === '1') {
        count++;
        bfs(grid, i, j);
      }
    }
  }
  return count;
}

function bfs(grid, i, j) {
  const queue = [[i, j]];
  grid[i][j] = '0';
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = r+dr, nc = c+dc;
      if (nr>=0 && nr<grid.length && nc>=0 && nc<grid[0].length && grid[nr][nc]==='1') {
        grid[nr][nc] = '0';
        queue.push([nr, nc]);
      }
    }
  }
}`,
  sorting: `// Merge Sort
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

console.log(mergeSort([5, 2, 8, 1, 9])); // [1, 2, 5, 8, 9]`
};

const errorPatterns = [
  { pattern: /SyntaxError|unexpected token/i, type: 'Syntax Error', msg: 'Check your brackets, parentheses, and semicolons carefully.' },
  { pattern: /is not defined|ReferenceError/i, type: 'Reference Error', msg: 'A variable is not defined. Check variable names and scope.' },
  { pattern: /is not a function|TypeError/i, type: 'Type Error', msg: 'Function call error. Make sure the method exists on that data type.' },
  { pattern: /Cannot read|null|undefined/i, type: 'Null Error', msg: 'Null reference error. Check if variables are properly initialized.' }
];

export default function CodingPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = topics.find(t => t.id === topicId);

  const [approach, setApproach] = useState('');
  const [approachUnlocked, setApproachUnlocked] = useState(false);
  const [approachFeedback, setApproachFeedback] = useState('');
  const [code, setCode] = useState(starterCodes[topicId] || '// Write your code here\n');
  const [output, setOutput] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [running, setRunning] = useState(false);

  if (!topic) return <div className="error-page">Topic not found</div>;

  const checkApproach = () => {
    const keywords = approachKeywords[topicId] || [];
    const text = approach.toLowerCase();
    const matched = keywords.filter(kw => text.includes(kw));
    if (matched.length >= 2) {
      setApproachUnlocked(true);
      setApproachFeedback('✅ Great approach! Compiler unlocked!');
      speak('Excellent! Your approach is correct. The compiler is now unlocked. Start coding!');
    } else {
      setApproachFeedback(`❌ Think more about ${topic.concepts[0]} and ${topic.concepts[1]}. Describe your approach using these concepts.`);
      speak(`Not quite. Think about how ${topic.name} concepts like ${topic.concepts[0]} can be applied here.`);
    }
  };

  const runCode = () => {
    setRunning(true);
    setOutput('');
    setAiFeedback('');
    try {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.map(a =>
        typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      // eslint-disable-next-line no-new-func
      new Function(code)();
      console.log = originalLog;
      const result = logs.join('\n') || 'Code ran with no output.';
      setOutput(result);
      setAiFeedback('✅ Code ran successfully! Check output above.');
      speak('Your code executed successfully.');
    } catch (err) {
      const errMsg = err.message || err.toString();
      setOutput(`Error: ${errMsg}`);
      const matched = errorPatterns.find(p => p.pattern.test(errMsg));
      if (matched) {
        setAiFeedback(`🐛 ${matched.type}: ${matched.msg}`);
        speak(matched.msg);
      } else {
        setAiFeedback(`🐛 Error: ${errMsg}`);
        speak(`Error detected: ${errMsg}`);
      }
    }
    setRunning(false);
  };

  return (
    <div className="layout">
      <Sidebar activeTopic={topicId} />
      <main className="main-content">
        <div className="coding-header">
          <h2>{topic.icon} {topic.name} — Coding Challenge</h2>
        </div>

        {!approachUnlocked ? (
          <div className="approach-section">
            <div className="approach-card fade-up">
              <h3 className="approach-title">🧠 Describe Your Approach First</h3>
              <p className="approach-desc">
                Before coding, explain how you would solve a {topic.name} problem.
                Think about: data structures, algorithms, time complexity.
              </p>
              <textarea
                className="approach-textarea"
                value={approach}
                onChange={e => setApproach(e.target.value)}
                placeholder={`I would use ${topic.concepts[0]} to solve this by...`}
                rows={5}
              />
              {approachFeedback && (
                <div className={`approach-feedback ${approachFeedback.startsWith('✅') ? 'feedback-ok' : 'feedback-bad'}`}>
                  {approachFeedback}
                </div>
              )}
              <button
                className="btn-primary"
                onClick={checkApproach}
                disabled={approach.trim().length < 10}
              >
                Check Approach
              </button>
            </div>
          </div>
        ) : (
          <div className="editor-section fade-up">
            <div className="editor-card">
              <div className="editor-titlebar">
                <div className="titlebar-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="editor-filename">{topicId}_solution.js</span>
                <span className="editor-lang">JavaScript</span>
              </div>
              <textarea
                className="code-editor"
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
              />
              <div className="editor-footer">
                <button className="btn-outline btn-sm"
                  onClick={() => navigate('/problems')}>
                  Try Problems →
                </button>
                <button className="btn-run" onClick={runCode} disabled={running}>
                  {running ? '⏳ Running...' : '▶ Run Code'}
                </button>
              </div>
            </div>

            {output && (
              <div className="output-card">
                <div className="output-header">Output</div>
                <pre className="output-content">{output}</pre>
              </div>
            )}

            {aiFeedback && (
              <div className={`ai-feedback-card ${aiFeedback.startsWith('✅') ? 'feedback-ok' : 'feedback-bad'}`}>
                <div className="ai-feedback-header">🤖 AI Feedback</div>
                <p className="ai-feedback-text">{aiFeedback}</p>
              </div>
            )}

            <div className="coding-nav">
              <button className="btn-outline"
                onClick={() => navigate(`/practice/${topicId}`)}>
                ← Back to Practice
              </button>
              <button className="btn-primary"
                onClick={() => navigate('/problems')}>
                LeetCode Problems →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}