import type { ObjectType } from "../../types/domain";

export type GraphLayoutNode = {
  id: string;
  type: ObjectType;
  title: string;
  position: { x: number; y: number };
  width: number;
  height: number;
};

export type GraphLayoutEdge = { source: string; target: string };

export type GraphLayout = {
  ranks: Map<string, number>;
  positions: Map<string, { x: number; y: number }>;
};

export const semanticStage: Record<ObjectType, number> = {
  business_problem: 0,
  research_question: 1,
  study: 2,
  dataset: 2,
  result: 3,
  insight: 4,
  recommendation: 5,
};

type Component = { nodeIds: string[]; edges: GraphLayoutEdge[] };
type Order = Map<string, number>;

const compareNodes = (left: GraphLayoutNode, right: GraphLayoutNode) =>
  semanticStage[left.type] - semanticStage[right.type] || left.title.localeCompare(right.title) || left.id.localeCompare(right.id);

/** Finds components without assigning semantic meaning to edge direction. */
function connectedComponents(nodes: GraphLayoutNode[], edges: GraphLayoutEdge[]): Component[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, Set<string>>(nodes.map((node) => [node.id, new Set()]));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  const visited = new Set<string>();
  const components: Component[] = [];
  for (const node of [...nodes].sort(compareNodes)) {
    if (visited.has(node.id)) continue;
    const stack = [node.id];
    const ids: string[] = [];
    visited.add(node.id);
    while (stack.length) {
      const id = stack.pop()!;
      ids.push(id);
      for (const adjacentId of adjacency.get(id) ?? []) {
        if (!visited.has(adjacentId)) {
          visited.add(adjacentId);
          stack.push(adjacentId);
        }
      }
    }
    const idSet = new Set(ids);
    components.push({ nodeIds: ids, edges: edges.filter((edge) => idSet.has(edge.source) && idSet.has(edge.target)) });
  }
  return components;
}

/**
 * A cycle-safe directed longest-path pass. Nodes without incoming links are
 * likely roots. Cycle members receive a deterministic fallback depth instead
 * of recursively advancing forever.
 */
function provisionalDepths(component: Component, nodesById: Map<string, GraphLayoutNode>) {
  const outgoing = new Map(component.nodeIds.map((id) => [id, [] as string[]]));
  const incoming = new Map(component.nodeIds.map((id) => [id, 0]));
  for (const edge of component.edges) {
    outgoing.get(edge.source)!.push(edge.target);
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
  }

  const depth = new Map(component.nodeIds.map((id) => [id, 0]));
  const roots = component.nodeIds.filter((id) => incoming.get(id) === 0);
  const queue = (roots.length ? roots : component.nodeIds)
    .slice()
    .sort((left, right) => compareNodes(nodesById.get(left)!, nodesById.get(right)!));
  const remainingIncoming = new Map(incoming);
  let cursor = 0;
  while (cursor < queue.length) {
    const id = queue[cursor++];
    for (const childId of outgoing.get(id) ?? []) {
      depth.set(childId, Math.max(depth.get(childId) ?? 0, (depth.get(id) ?? 0) + 1));
      remainingIncoming.set(childId, (remainingIncoming.get(childId) ?? 0) - 1);
      if (remainingIncoming.get(childId) === 0) queue.push(childId);
    }
  }
  return depth;
}

/**
 * Same-type parent → child links get a sub-rank, guaranteeing that two Studies
 * (or any other same-type pair) do not occupy the same horizontal rank.
 */
function sameTypeSubranks(nodes: GraphLayoutNode[], edges: GraphLayoutEdge[]) {
  const result = new Map(nodes.map((node) => [node.id, 0]));
  for (const type of Object.keys(semanticStage) as ObjectType[]) {
    const typeNodes = nodes.filter((node) => node.type === type);
    const typeIds = new Set(typeNodes.map((node) => node.id));
    const typeEdges = edges.filter((edge) => typeIds.has(edge.source) && typeIds.has(edge.target));
    if (!typeEdges.length) continue;
    const depths = provisionalDepths(
      { nodeIds: typeNodes.map((node) => node.id), edges: typeEdges },
      new Map(typeNodes.map((node) => [node.id, node])),
    );
    for (const [id, depth] of depths) result.set(id, depth);
  }
  return result;
}

function barycentricOrder(
  columns: Map<number, GraphLayoutNode[]>,
  adjacency: Map<string, Set<string>>,
  provisionalDepth: Map<string, number>,
): Order {
  const order: Order = new Map();
  const keys = [...columns.keys()].sort((left, right) => left - right);
  const columnOf = new Map<string, number>();
  for (const [key, column] of columns) for (const node of column) columnOf.set(node.id, key);

  for (const key of keys) {
    columns.get(key)!
      .sort((left, right) =>
        (provisionalDepth.get(left.id) ?? 0) - (provisionalDepth.get(right.id) ?? 0) ||
        left.position.y - right.position.y ||
        compareNodes(left, right),
      )
      .forEach((node, index) => order.set(node.id, index));
  }

  const sortColumn = (key: number, neighbourColumns: Set<number>) => {
    const column = columns.get(key)!;
    const barycenter = (node: GraphLayoutNode) => {
      const values = [...(adjacency.get(node.id) ?? [])]
        .filter((id) => neighbourColumns.has(columnOf.get(id) ?? key))
        .map((id) => order.get(id))
        .filter((value): value is number => value !== undefined);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : order.get(node.id)!;
    };
    column.sort((left, right) => barycenter(left) - barycenter(right) || order.get(left.id)! - order.get(right.id)!);
    column.forEach((node, index) => order.set(node.id, index));
  };

  // Forward/backward sweeps group siblings and reduce avoidable crossings while
  // relationships remain unable to alter semantic horizontal order.
  for (let sweep = 0; sweep < 2; sweep++) {
    for (let index = 1; index < keys.length; index++) sortColumn(keys[index], new Set(keys.slice(0, index)));
    for (let index = keys.length - 2; index >= 0; index--) sortColumn(keys[index], new Set(keys.slice(index + 1)));
  }
  return order;
}

/**
 * Explicit hybrid graph layout: topology identifies components, likely roots
 * and provisional depth; Object Type remains the horizontal ordering constraint.
 * Direct same-type relationships receive an adjacent sub-rank. Empty stages and
 * unused sub-ranks are compressed into only the columns that contain Objects.
 */
export function arrangeGraph(nodes: GraphLayoutNode[], edges: GraphLayoutEdge[]): GraphLayout {
  if (!nodes.length) return { ranks: new Map(), positions: new Map() };

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const validEdges = edges.filter((edge) => nodesById.has(edge.source) && nodesById.has(edge.target));
  const subranks = sameTypeSubranks(nodes, validEdges);
  const usedStages = [...new Set(nodes.map((node) => semanticStage[node.type]))].sort((left, right) => left - right);
  const compactStages = new Map(usedStages.map((stage, index) => [stage, index]));
  const rankKey = new Map(
    nodes.map((node) => [node.id, `${compactStages.get(semanticStage[node.type])}:${subranks.get(node.id) ?? 0}`]),
  );
  const orderedKeys = [...new Set(rankKey.values())].sort((left, right) => {
    const [leftStage, leftSubrank] = left.split(":").map(Number);
    const [rightStage, rightSubrank] = right.split(":").map(Number);
    return leftStage - rightStage || leftSubrank - rightSubrank;
  });
  const visualRanks = new Map(orderedKeys.map((key, index) => [key, index]));
  const ranks = new Map(nodes.map((node) => [node.id, visualRanks.get(rankKey.get(node.id)!)!]));

  const adjacency = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of validEdges) {
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  const positions = new Map<string, { x: number; y: number }>();
  let componentY = 80;
  for (const component of connectedComponents(nodes, validEdges)) {
    const componentNodes = component.nodeIds.map((id) => nodesById.get(id)!);
    const depths = provisionalDepths(component, nodesById);
    const columns = new Map<number, GraphLayoutNode[]>();
    for (const node of componentNodes) {
      const rank = ranks.get(node.id)!;
      columns.set(rank, [...(columns.get(rank) ?? []), node]);
    }
    const order = barycentricOrder(columns, adjacency, depths);
    const keys = [...columns.keys()].sort((left, right) => left - right);
    let x = 80;
    let componentHeight = 0;
    for (const rank of keys) {
      const column = columns.get(rank)!.sort((left, right) => order.get(left.id)! - order.get(right.id)!);
      const width = Math.max(...column.map((node) => node.width));
      let y = componentY;
      for (const node of column) {
        positions.set(node.id, { x, y });
        y += node.height + 60;
      }
      componentHeight = Math.max(componentHeight, y - componentY - 60);
      x += width + 150;
    }
    componentY += componentHeight + 100;
  }
  return { ranks, positions };
}
