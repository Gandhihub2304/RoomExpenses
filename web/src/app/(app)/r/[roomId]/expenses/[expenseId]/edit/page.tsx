import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function EditExpensePage({
  params,
}: PageProps<"/r/[roomId]/expenses/[expenseId]/edit">) {
  const { roomId, expenseId } = await params;
  return <ExpenseForm roomId={roomId} expenseId={expenseId} />;
}
