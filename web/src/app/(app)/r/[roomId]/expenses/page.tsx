import { ExpensesList } from "@/components/expenses/expenses-list";

export default async function ExpensesPage({ params }: PageProps<"/r/[roomId]/expenses">) {
  const { roomId } = await params;
  return <ExpensesList roomId={roomId} />;
}
