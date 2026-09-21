import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage({ params }: PageProps<"/r/[roomId]/expenses/new">) {
  const { roomId } = await params;
  return <ExpenseForm roomId={roomId} />;
}
