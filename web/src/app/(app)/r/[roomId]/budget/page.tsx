import { BudgetPage } from "@/components/budget/budget-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/budget">) {
  const { roomId } = await params;
  return <BudgetPage roomId={roomId} />;
}
