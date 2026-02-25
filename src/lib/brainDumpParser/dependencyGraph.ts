// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 4: Task Dependency Graph
// Find 'X before Y' relationships using directed graph + topological sort
// ═══════════════════════════════════════════════════════════════════════════

export interface TaskNode {
  id: string;
  text: string;
  dependencies: string[]; // ids of tasks that must happen first
  dependents: string[]; // ids of tasks that depend on this one
}

export interface Dependency {
  before: string; // task that must happen first
  after: string; // task that depends on the first
}

/**
 * Dependency detection patterns
 * Matches natural language expressing task relationships
 */
const DEPENDENCY_PATTERNS: Array<{
  re: RegExp;
  fromGroup: number;
  toGroup: number;
}> = [
  { re: /(.+?)\s+before\s+(.+)/i, fromGroup: 1, toGroup: 2 }, // 'A before B' → do A first
  { re: /(.+?)\s+before i can\s+(.+)/i, fromGroup: 1, toGroup: 2 },
  { re: /can.?t (.+?) until\s+(.+)/i, fromGroup: 2, toGroup: 1 }, // 'can't X until Y done' → Y first
  { re: /need to (.+?) first.+?then (.+)/i, fromGroup: 1, toGroup: 2 },
  { re: /(.+?) depends on (.+)/i, fromGroup: 2, toGroup: 1 },
  { re: /waiting for (.+?) to (.+)/i, fromGroup: 1, toGroup: 2 },
  { re: /after (.+?)(?:,|\.)\s+(.+)/i, fromGroup: 1, toGroup: 2 },
  { re: /once (.+?)(?:,|\.)\s+(.+)/i, fromGroup: 1, toGroup: 2 },
  { re: /when (.+?) is done.+?(.+)/i, fromGroup: 1, toGroup: 2 },
];

/**
 * Directed Acyclic Graph for task dependencies
 * Uses Kahn's algorithm for topological sorting
 */
export class TaskGraph {
  private nodes: Map<string, TaskNode> = new Map();

  /**
   * Add a task to the graph
   */
  addTask(id: string, text: string): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        text,
        dependencies: [],
        dependents: [],
      });
    }
  }

  /**
   * Add a dependency relationship
   * fromId must complete BEFORE toId can start
   */
  addDependency(fromId: string, toId: string): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);

    if (fromNode && toNode) {
      // Avoid duplicates
      if (!fromNode.dependents.includes(toId)) {
        fromNode.dependents.push(toId);
      }
      if (!toNode.dependencies.includes(fromId)) {
        toNode.dependencies.push(fromId);
      }
    }
  }

  /**
   * Kahn's algorithm — topological sort
   * Returns tasks in the order they should be done
   * Respects all dependency constraints
   */
  topologicalSort(): TaskNode[] {
    const inDegree = new Map<string, number>();
    this.nodes.forEach((node, id) => {
      inDegree.set(id, node.dependencies.length);
    });

    // Start with tasks that have no dependencies
    const queue: string[] = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    const result: TaskNode[] = [];

    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = this.nodes.get(id)!;
      result.push(node);

      // Reduce in-degree for dependent tasks
      for (const depId of node.dependents) {
        inDegree.set(depId, inDegree.get(depId)! - 1);
        if (inDegree.get(depId) === 0) {
          queue.push(depId);
        }
      }
    }

    // If result.length !== nodes.size, there's a cycle (circular dependency)
    // Return best-effort order
    if (result.length < this.nodes.size) {
      console.warn('KAAL: Circular dependency detected in task graph');
      // Add remaining nodes in arbitrary order
      this.nodes.forEach((node) => {
        if (!result.find((n) => n.id === node.id)) {
          result.push(node);
        }
      });
    }

    return result;
  }

  /**
   * Detect explicit dependency language in text segments
   * Returns array of dependency relationships found
   */
  static detectDependencies(segments: string[]): Dependency[] {
    const deps: Dependency[] = [];

    for (const segment of segments) {
      for (const pattern of DEPENDENCY_PATTERNS) {
        const match = segment.match(pattern.re);
        if (match && pattern.fromGroup && pattern.toGroup) {
          deps.push({
            before: match[pattern.fromGroup].trim(),
            after: match[pattern.toGroup].trim(),
          });
        }
      }
    }

    return deps;
  }

  /**
   * Find closest matching task node for a text fragment
   * Uses simple word overlap similarity
   */
  findClosestTask(fragment: string): TaskNode | null {
    let best: TaskNode | null = null;
    let bestScore = 0;

    const fragmentWords = new Set(
      fragment.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    );

    this.nodes.forEach((node) => {
      const nodeWords = new Set(
        node.text.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
      );

      // Jaccard similarity
      const intersection = new Set(
        [...fragmentWords].filter((w) => nodeWords.has(w))
      );
      const union = new Set([...fragmentWords, ...nodeWords]);
      const similarity = intersection.size / union.size;

      if (similarity > bestScore && similarity > 0.3) {
        bestScore = similarity;
        best = node;
      }
    });

    return best;
  }

  /**
   * Get all nodes
   */
  getAllNodes(): TaskNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes with no dependencies (can start immediately)
   */
  getRootNodes(): TaskNode[] {
    return Array.from(this.nodes.values()).filter(
      (node) => node.dependencies.length === 0
    );
  }

  /**
   * Get nodes with no dependents (terminal tasks)
   */
  getLeafNodes(): TaskNode[] {
    return Array.from(this.nodes.values()).filter(
      (node) => node.dependents.length === 0
    );
  }

  /**
   * Check if there are any circular dependencies
   */
  hasCircularDependency(): boolean {
    const sorted = this.topologicalSort();
    return sorted.length < this.nodes.size;
  }

  /**
   * Get dependency chains (paths from root to leaf)
   */
  getDependencyChains(): TaskNode[][] {
    const chains: TaskNode[][] = [];
    const visited = new Set<string>();

    const dfs = (node: TaskNode, path: TaskNode[]) => {
      if (visited.has(node.id)) return;

      const newPath = [...path, node];

      if (node.dependents.length === 0) {
        // Leaf node - complete chain
        chains.push(newPath);
      } else {
        // Continue down each dependent path
        for (const depId of node.dependents) {
          const depNode = this.nodes.get(depId);
          if (depNode) dfs(depNode, newPath);
        }
      }

      visited.add(node.id);
    };

    // Start from all root nodes
    this.getRootNodes().forEach((root) => dfs(root, []));

    return chains;
  }
}
