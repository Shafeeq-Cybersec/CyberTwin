// Auto-layout for the twin graph using dagre (directed layered layout).

import dagre from "dagre";
import { Position, type Edge, type Node } from "reactflow";

const NODE_WIDTH = 176; // matches the w-44 node
const NODE_HEIGHT = 84;

/**
 * Compute positions for all nodes given the edges, returning new node
 * objects with `position` set. `direction` is a dagre rank direction
 * ("TB" top-bottom, "LR" left-right).
 */
export function autoLayout(nodes: Node[], edges: Edge[], direction: "TB" | "LR" = "TB"): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const horizontal = direction === "LR";
  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    return {
      ...node,
      // dagre gives center coords; React Flow wants top-left
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      targetPosition: horizontal ? Position.Left : Position.Top,
      sourcePosition: horizontal ? Position.Right : Position.Bottom,
    };
  });
}
