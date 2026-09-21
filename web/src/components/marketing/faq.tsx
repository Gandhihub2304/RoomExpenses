import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "Is RoomMate free to use?",
    answer:
      "Yes. The core room-management features — expenses, settlements, budgets, and bills — are free for households of any size.",
  },
  {
    question: "What's the difference between a Room Admin and a Roommate?",
    answer:
      "A Room Admin manages the room: adding expenses, inviting members, configuring budgets, and reviewing settlements. Roommates get full transparency into shared room activity plus their own personal balance, but can't edit room settings or other members' data. You can be an Admin in one room and a Roommate in another.",
  },
  {
    question: "How does splitting an expense work?",
    answer:
      "Choose equal, percentage, exact-amount, or share-based splitting when you add an expense. RoomMate calculates each participant's share instantly and keeps everyone's balance up to date.",
  },
  {
    question: "Can I use RoomMate for rent and recurring bills?",
    answer:
      "Yes — set up recurring expenses for rent, electricity, Wi-Fi, or groceries with a frequency and due date, and RoomMate creates and reminds automatically.",
  },
  {
    question: "Is my financial data safe?",
    answer:
      "RoomMate never stores banking credentials. Sessions are encrypted, permissions are enforced on the server for every request, and all room activity is logged in an audit trail visible to admins.",
  },
  {
    question: "Can I install RoomMate on my phone?",
    answer:
      "Yes — RoomMate is an installable Progressive Web App. Add it to your home screen from your mobile browser for a native app-like experience.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <Accordion className="mt-10 w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.question} value={i}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
