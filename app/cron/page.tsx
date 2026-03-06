import { useCases } from "@/lib/use-cases";
import ScheduleView from "./schedule-view";

export default async function SchedulePage() {
  const cronJobs = await useCases.listCronJobs();
  return <ScheduleView jobs={cronJobs} />;
}
