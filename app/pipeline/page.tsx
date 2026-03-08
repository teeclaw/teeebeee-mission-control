import { useCases } from "@/lib/use-cases";
import type { OpportunityStage, Decision } from "@/lib/types";

const stages: OpportunityStage[] = ["signal", "thesis", "validation", "build", "launch"];

const stageColors: Record<OpportunityStage, string> = {
  signal: "var(--text-3)",
  thesis: "var(--blue)",
  validation: "var(--amber)",
  build: "var(--green)",
  launch: "var(--green)",
};

function ConfBar({ v }: { v: number }) {
  const c = v >= 80 ? "var(--green)" : v >= 60 ? "var(--amber)" : "var(--red)";
  return (
    <div className="conf-wrap">
      <div className="conf-bar"><div className="conf-fill" style={{ width: `${v}%`, background: c }} /></div>
      <span className="conf-num">{v}%</span>
    </div>
  );
}

function DecisionTag({ decision }: { decision: Decision | null | undefined }) {
  if (!decision) {
    return <span className="tag tag-pending">Pending</span>;
  }
  
  const styles = {
    GO: { className: "tag tag-go", text: "GO" },
    CONDITIONAL_GO: { className: "tag tag-conditional", text: "CONDITIONAL" },
    NO_GO: { className: "tag tag-no-go", text: "NO-GO" }
  };
  
  const style = styles[decision];
  return <span className={style.className}>{style.text}</span>;
}

export default async function PipelinePage() {
  const [pipeline, vq] = await Promise.all([
    useCases.listPipelineWithDecisions(),
    useCases.listValidationQueue(),
  ]);

  return (
    <>
      <div className="page-head">
        <h1>Opportunity Pipeline</h1>
        <div className="live-pill">
          <span className="live-dot" />
          {pipeline.length} opportunities · {vq.length} awaiting validation
        </div>
      </div>

      {/* Stage summary */}
      <section className="stage-grid" style={{ marginBottom: 28 }}>
        {stages.map((stage) => {
          const count = pipeline.filter((p) => p.stage === stage).length;
          return (
            <div key={stage} className="panel">
              <div className="stat-label">{stage}</div>
              <div className="stat-num" style={{ color: stageColors[stage] }}>{count}</div>
            </div>
          );
        })}
      </section>

      {/* Full pipeline table */}
      <article className="panel">
        <div className="panel-head">
          <span className="panel-title">All Opportunities</span>
          <span className="panel-count">{pipeline.length}</span>
        </div>
        <div className="table-head">
          <span className="th th-grow">Opportunity</span>
          <span className="th th-md">Owner</span>
          <span className="th th-xs">Role</span>
          <span className="th th-sm">Confidence</span>
          <span className="th th-sm">Decision</span>
          <span className="th th-sm">Stage</span>
        </div>
        {pipeline.map((item) => (
          <div key={item.id} className="table-row">
            <span className="td td-grow">
              <span className="row-name">{item.title}</span>
            </span>
            <span className="td td-md row-sub">{item.owner}</span>
            <span className="td td-xs role-tag">{item.role || 'AGENT'}</span>
            <span className="td td-sm"><ConfBar v={item.confidence} /></span>
            <span className="td td-sm"><DecisionTag decision={item.decision} /></span>
            <span className="td td-sm"><span className="tag tag-stage">{item.stage}</span></span>
          </div>
        ))}
        {pipeline.length === 0 && <div className="empty">No opportunities in pipeline</div>}
      </article>

      {/* Validation queue */}
      {vq.length > 0 && (
        <article className="panel" style={{ marginTop: 20 }}>
          <div className="panel-head">
            <span className="panel-title">Awaiting Validation</span>
            <span className="panel-count">{vq.length}</span>
          </div>
          {vq.map((v) => (
            <div key={v.id} className="row">
              <span className="row-name">{v.title}</span>
              <span className="tag tag-stage">awaiting</span>
            </div>
          ))}
        </article>
      )}
    </>
  );
}
