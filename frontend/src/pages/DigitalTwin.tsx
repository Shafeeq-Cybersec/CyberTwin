import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Search,
  LayoutGrid,
  RefreshCw,
  X,
  ExternalLink,
  Plus,
  ListTree,
  ChevronDown,
  Crosshair,
} from "lucide-react";

import * as twinApi from "../api/twin";
import type {
  AttackPath,
  Graph,
  RelationshipRules,
  RelationshipType,
  RelationshipView,
} from "../types/twin";
import AttackPathPanel from "../components/twin/AttackPathPanel";
import BlastRadiusModal from "../components/twin/BlastRadiusModal";
import type { BlastRadiusResponse } from "../types/twin";
import { Flame } from "lucide-react";
import type { AssetType, Criticality } from "../types/asset";
import {
  ASSET_TYPE_LABELS,
  CRITICALITY_LABELS,
  CRITICALITY_STYLES,
  RISK_LEVEL_HEX,
} from "../types/asset";
import AssetNode, { type AssetNodeData } from "../components/twin/AssetNode";
import { autoLayout } from "../components/twin/layout";
import { RELATIONSHIP_COLORS } from "../components/twin/assetVisuals";
import RelationshipDialog from "../components/twin/RelationshipDialog";
import RelationshipViewer from "../components/twin/RelationshipViewer";
import ConfirmDialog from "../components/assets/ConfirmDialog";
import Badge from "../components/ui/Badge";
import RiskBadge from "../components/ui/RiskBadge";

// Register the custom node type once (stable reference)
const nodeTypes = { asset: AssetNode };

// Normal (non-highlighted) edge styling for a graph edge.
function normalEdge(e: Graph["edges"][number]): Edge {
  const color = RELATIONSHIP_COLORS[e.type as RelationshipType];
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.type,
    animated: true,
    style: { stroke: color, strokeWidth: 1.5, opacity: 1 },
    labelStyle: { fill: color, fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: "#0d1220", fillOpacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  };
}

/** Digital Twin — interactive React Flow graph + Relationship Engine. */
export default function DigitalTwin() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [rules, setRules] = useState<RelationshipRules | null>(null);
  const [relationships, setRelationships] = useState<RelationshipView[]>([]);
  const [loading, setLoading] = useState(true);
  const [relLoading, setRelLoading] = useState(true);
  const [error, setError] = useState("");

  const [nodes, setNodes, onNodesChange] = useNodesState<AssetNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Filters / search
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "">("");
  const [critFilter, setCritFilter] = useState<Criticality | "">("");
  const [selected, setSelected] = useState<
    (AssetNodeData & { id: string; ip: string | null }) | null
  >(null);

  // Relationship engine UI state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRel, setEditingRel] = useState<RelationshipView | null>(null);
  const [prefill, setPrefill] = useState<{ source: string; target: string } | null>(null);
  const [deletingRel, setDeletingRel] = useState<RelationshipView | null>(null);

  // Attack path analysis state
  const [attackOpen, setAttackOpen] = useState(false);
  const [attackPaths, setAttackPaths] = useState<AttackPath[]>([]);
  const [attackLoading, setAttackLoading] = useState(false);
    const [selectedPath, setSelectedPath] = useState<AttackPath | null>(null);

  // Blast radius state
  const [blastOpen, setBlastOpen] = useState(false);
  const [blastData, setBlastData] = useState<BlastRadiusResponse | null>(null);
  const [blastLoading, setBlastLoading] = useState(false);

  const triggerBlastRadius = async (assetId: string) => {
    setBlastOpen(true);
    setBlastLoading(true);
    try {
      const res = await twinApi.getBlastRadius(assetId);
      setBlastData(res);
    } catch {
      setBlastData(null);
    } finally {
      setBlastLoading(false);
    }
  };

  // --- Data fetching --------------------------------------------------------

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setGraph(await twinApi.getGraph());
    } catch {
      setError("Failed to load the twin graph. Is the backend running and Neo4j connected?");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRelationships = useCallback(async () => {
    setRelLoading(true);
    try {
      setRelationships(await twinApi.listRelationships());
    } catch {
      /* surfaced via the graph error banner */
    } finally {
      setRelLoading(false);
    }
  }, []);

  // Refresh everything after a mutation so the graph + viewer stay in sync
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchGraph(), fetchRelationships()]);
  }, [fetchGraph, fetchRelationships]);

  useEffect(() => {
    twinApi.getRelationshipRules().then(setRules).catch(() => setRules(null));
    refreshAll();
  }, [refreshAll]);

  // --- Search / filter matching --------------------------------------------

  const matches = useCallback(
    (n: Graph["nodes"][number]) => {
      const term = search.trim().toLowerCase();
      const matchSearch =
        !term ||
        n.name.toLowerCase().includes(term) ||
        (n.hostname ?? "").toLowerCase().includes(term) ||
        (n.ip_address ?? "").toLowerCase().includes(term);
      const matchType = !typeFilter || n.asset_type === typeFilter;
      const matchCrit = !critFilter || n.criticality === critFilter;
      return matchSearch && matchType && matchCrit;
    },
    [search, typeFilter, critFilter]
  );

  // --- Build React Flow model from the graph --------------------------------

  useEffect(() => {
    if (!graph) return;

    const rfNodes: Node<AssetNodeData>[] = graph.nodes.map((n) => ({
      id: n.id,
      type: "asset",
      position: { x: 0, y: 0 }, // replaced by autoLayout below
      data: {
        label: n.name,
        assetType: n.asset_type,
        criticality: n.criticality,
        status: n.status,
        hostname: n.hostname,
        riskScore: n.risk_score,
        riskLevel: n.risk_level,
        dimmed: !matches(n),
      },
    }));

    const rfEdges: Edge[] = graph.edges.map(normalEdge); // animated edges

    setNodes(autoLayout(rfNodes, rfEdges));
    setEdges(rfEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // Update node dimming when search/filters change (skip while an attack path
  // is highlighted — that path controls dimming instead).
  useEffect(() => {
    if (!graph || selectedPath) return;
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    setNodes((prev) =>
      prev.map((node) => {
        const src = byId.get(node.id);
        return src ? { ...node, data: { ...node.data, dimmed: !matches(src) } } : node;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, graph, selectedPath]);

  // Highlight the selected attack path on the graph (or restore normal view).
  useEffect(() => {
    if (!graph) return;

    if (!selectedPath) {
      // Restore: normal edges + filter-based node dimming
      setEdges(graph.edges.map(normalEdge));
      const byId = new Map(graph.nodes.map((n) => [n.id, n]));
      setNodes((prev) =>
        prev.map((node) => {
          const src = byId.get(node.id);
          return src ? { ...node, data: { ...node.data, dimmed: !matches(src) } } : node;
        })
      );
      return;
    }

    const pathNodeIds = new Set(selectedPath.nodes.map((n) => n.id));
    const pathPairs = new Set(selectedPath.steps.map((s) => `${s.from_id}->${s.to_id}`));

    // Dim everything not on the path
    setNodes((prev) =>
      prev.map((node) => ({ ...node, data: { ...node.data, dimmed: !pathNodeIds.has(node.id) } }))
    );

    // Draw path edges red/thick, fade the rest
    setEdges((prev) =>
      prev.map((e) => {
        const onPath = pathPairs.has(`${e.source}->${e.target}`);
        return onPath
          ? {
              ...e,
              animated: true,
              style: { stroke: "#f43f5e", strokeWidth: 3, opacity: 1 },
              labelStyle: { fill: "#f43f5e", fontSize: 10, fontWeight: 700 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" },
              zIndex: 10,
            }
          : {
              ...e,
              animated: false,
              style: { stroke: "#334155", strokeWidth: 1, opacity: 0.2 },
              labelStyle: { opacity: 0 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#334155" },
            };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, graph]);

  const relayout = useCallback(() => {
    setNodes((prev) => autoLayout(prev, edges));
  }, [edges, setNodes]);

  // Fetch and open the attack-path analysis panel
  const openAttackAnalysis = useCallback(async () => {
    setAttackOpen(true);
    setSelectedPath(null);
    setAttackLoading(true);
    try {
      const res = await twinApi.getAttackPaths();
      setAttackPaths(res.paths);
    } catch {
      setAttackPaths([]);
    } finally {
      setAttackLoading(false);
    }
  }, []);

  const closeAttackAnalysis = useCallback(() => {
    setAttackOpen(false);
    setSelectedPath(null); // triggers restore of the normal view
  }, []);

  // --- Interactions ---------------------------------------------------------

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const src = graph?.nodes.find((n) => n.id === node.id);
      if (src) {
        setSelected({
          id: src.id,
          label: src.name,
          assetType: src.asset_type,
          criticality: src.criticality,
          status: src.status,
          hostname: src.hostname,
          ip: src.ip_address,
          riskScore: src.risk_score,
          riskLevel: src.risk_level,
          dimmed: false,
        });
      }
    },
    [graph]
  );

  // Draw an edge on the canvas → open the create dialog pre-filled
  const onConnect = useCallback((c: Connection) => {
    if (c.source && c.target) {
      setEditingRel(null);
      setPrefill({ source: c.source, target: c.target });
      setDialogOpen(true);
    }
  }, []);

  const openCreate = () => {
    setEditingRel(null);
    setPrefill(null);
    setDialogOpen(true);
  };

  const openEdit = (rel: RelationshipView) => {
    setEditingRel(rel);
    setPrefill(null);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRel) return;
    await twinApi.deleteRelationship(deletingRel.id);
    setDeletingRel(null);
    await refreshAll(); // graph updates immediately
  };

  const stats = useMemo(
    () => ({ nodes: graph?.nodes.length ?? 0, edges: graph?.edges.length ?? 0 }),
    [graph]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-3">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Digital Twin</h2>
          <p className="text-sm text-slate-500">
            {stats.nodes} assets · {stats.edges} relationships
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <div className="flex items-center gap-2 bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              className="bg-transparent outline-none text-sm w-40 placeholder-slate-500"
              placeholder="Search nodes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="input w-auto py-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AssetType | "")}>
            <option value="">All Types</option>
            {Object.entries(ASSET_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <select className="input w-auto py-2" value={critFilter} onChange={(e) => setCritFilter(e.target.value as Criticality | "")}>
            <option value="">All Risk</option>
            {Object.entries(CRITICALITY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>

          <button onClick={relayout} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700" title="Auto layout">
            <LayoutGrid className="w-4 h-4" /> Layout
          </button>
          <button onClick={refreshAll} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={attackOpen ? closeAttackAnalysis : openAttackAnalysis}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              attackOpen
                ? "bg-severity-critical/15 border-severity-critical/40 text-severity-critical"
                : "bg-surface-800 border-surface-600/50 text-slate-300 hover:bg-surface-700"
            }`}
            title="Attack path analysis"
          >
            <Crosshair className="w-4 h-4" /> Attack Paths
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Relationship
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-severity-critical bg-severity-critical/10 border border-severity-critical/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Canvas + details panel */}
      <div className="relative flex-1 rounded-xl border border-surface-600/50 overflow-hidden bg-surface-950">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats.nodes === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <p className="text-slate-300">No assets to visualize yet.</p>
            <p className="text-sm text-slate-500 mt-1">
              Add assets in the <Link to="/assets" className="text-accent hover:underline">Inventory</Link>, then connect them here.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onConnect={onConnect}
            onPaneClick={() => setSelected(null)}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1b2438" />
            <Controls className="!bg-surface-800 !border-surface-600 [&>button]:!bg-surface-800 [&>button]:!border-surface-600 [&>button]:!text-slate-300" />
            <MiniMap
              pannable
              zoomable
              className="!bg-surface-900 !border !border-surface-600"
              nodeColor={(n) => RISK_LEVEL_HEX[(n.data as AssetNodeData)?.riskLevel] ?? "#64748b"}
              maskColor="rgba(10,14,23,0.7)"
            />
          </ReactFlow>
        )}

        {/* Hint about drawing edges */}
        {stats.nodes > 0 && (
          <div className="absolute bottom-3 left-3 text-[11px] text-slate-500 bg-surface-900/80 border border-surface-700/60 rounded-lg px-2.5 py-1.5">
            Tip: drag from a node handle to another node to connect them.
          </div>
        )}

        {/* Node details panel (hidden while the attack panel is open) */}
        {selected && !attackOpen && (
          <div className="absolute top-3 right-3 w-72 bg-surface-800/95 backdrop-blur border border-surface-600 rounded-xl p-4 shadow-glow animate-fade-in">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-slate-100 pr-4">{selected.label}</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-surface-700 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{ASSET_TYPE_LABELS[selected.assetType]}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <RiskBadge score={selected.riskScore} level={selected.riskLevel} size="sm" />
              <Badge className={CRITICALITY_STYLES[selected.criticality]}>{CRITICALITY_LABELS[selected.criticality]}</Badge>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Hostname</dt>
                <dd className="text-slate-300 font-mono text-xs truncate">{selected.hostname || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">IP Address</dt>
                <dd className="text-slate-300 font-mono text-xs truncate">{selected.ip || "—"}</dd>
              </div>
            </dl>
            <Link to={`/assets/${selected.id}`} className="mt-4 flex items-center justify-center gap-2 btn-primary w-full">
                            View Full Details <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={() => triggerBlastRadius(selected.id)}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-severity-critical/15 text-severity-critical hover:bg-severity-critical/25 border border-severity-critical/30 text-xs font-semibold transition"
            >
              <Flame className="w-3.5 h-3.5" /> Simulate Blast Radius
            </button>
          </div>
        )}

        {/* Attack path analysis panel */}
        {attackOpen && (
          <AttackPathPanel
            paths={attackPaths}
            loading={attackLoading}
            selected={selectedPath}
            onSelect={setSelectedPath}
            onClose={closeAttackAnalysis}
          />
        )}
      </div>

      {/* Relationship viewer (collapsible) */}
      <div className="card p-0 overflow-hidden shrink-0">
        <button
          onClick={() => setViewerOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-700/30"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <ListTree className="w-4 h-4 text-accent" />
            Relationships
            <span className="text-xs text-slate-500">({relationships.length})</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${viewerOpen ? "rotate-180" : ""}`} />
        </button>
        {viewerOpen && (
          <div className="border-t border-surface-700/60 max-h-64 overflow-y-auto">
            <RelationshipViewer
              relationships={relationships}
              loading={relLoading}
              onEdit={openEdit}
              onDelete={setDeletingRel}
            />
          </div>
        )}
      </div>

      {/* Create / Edit relationship dialog */}
      <RelationshipDialog
        open={dialogOpen}
        nodes={graph?.nodes ?? []}
        rules={rules}
        editing={editingRel}
        prefill={prefill}
        onClose={() => setDialogOpen(false)}
        onSaved={refreshAll}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingRel}
        title="Delete Relationship"
        message={
          deletingRel
            ? `Remove "${deletingRel.source_name} ${deletingRel.type} ${deletingRel.target_name}"?`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
                onClose={() => setDeletingRel(null)}
      />

      {/* Blast Radius Simulation Modal */}
      {blastOpen && (
        <BlastRadiusModal
          data={blastData}
          loading={blastLoading}
          onClose={() => setBlastOpen(false)}
        />
      )}
    </div>
  );
}





