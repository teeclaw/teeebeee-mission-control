import Link from "next/link";
import { notFound } from "next/navigation";
import { useCases } from "@/lib/use-cases";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function DecisionTag({ decision }: { decision: string | null | undefined }) {
  if (!decision) return <span className="tag tag-pending">Pending</span>;
  if (decision === "GO") return <span className="tag tag-go">GO</span>;
  if (decision === "NO_GO") return <span className="tag tag-no-go">NO-GO</span>;
  return <span className="tag tag-conditional">CONDITIONAL</span>;
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const [pipeline, report] = await Promise.all([
    useCases.listPipelineWithDecisions(),
    useCases.getOpportunityReport(params.id)
  ]);

  const opp = pipeline.find((p) => p.id === params.id);
  if (!opp) return notFound();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{opp.title}</h1>
          <div className="row-sub">Opportunity Report Template · {opp.id}</div>
        </div>
        <div className="f fi" style={{ gap: 8 }}>
          <DecisionTag decision={report?.validationDecision || opp.decision || null} />
          <span className="tag tag-stage">{opp.stage}</span>
          <Link href="/pipeline" className="btn btn-ghost">Back to Pipeline</Link>
        </div>
      </div>

      <section className="g">
        <article className="panel g12">
          <div className="panel-head">
            <span className="panel-title">Signal</span>
          </div>
          <div className="report-block">
            <div className="report-label">Summary</div>
            <p className="report-text">{report?.signalSummary || "Report not generated yet."}</p>
          </div>
          <div className="report-block">
            <div className="report-label">Evidence</div>
            <p className="report-text">{report?.signalEvidence || "Report not generated yet."}</p>
          </div>
        </article>

        <article className="panel g12">
          <div className="panel-head">
            <span className="panel-title">Thesis</span>
          </div>
          <div className="report-block">
            <div className="report-label">Hypothesis</div>
            <p className="report-text">{report?.thesisSummary || "Report not generated yet."}</p>
          </div>
          <div className="report-block">
            <div className="report-label">Business Model</div>
            <p className="report-text">{report?.thesisModel || "Report not generated yet."}</p>
          </div>
        </article>

        <article className="panel g12">
          <div className="panel-head">
            <span className="panel-title">Validation</span>
          </div>
          <div className="report-block">
            <div className="report-label">Decision</div>
            <p className="report-text"><DecisionTag decision={report?.validationDecision || opp.decision || null} /></p>
          </div>
          <div className="report-block">
            <div className="report-label">Rationale</div>
            <p className="report-text">{report?.validationSummary || "Report not generated yet."}</p>
          </div>
          <div className="report-block">
            <div className="report-label">Key Risks</div>
            <p className="report-text">{report?.keyRisks || "Report not generated yet."}</p>
          </div>
          <div className="report-block">
            <div className="report-label">Sources</div>
            <p className="report-text">{report?.sources || "Report not generated yet."}</p>
          </div>
        </article>
      </section>
    </>
  );
}
