import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";

const guides = [
  { title: "Add a transport record", items: ["Choose Add Record from the navigation bar.", "Enter the trip date, transporter name, freight memo number, vehicle number, and party name.", "Add the LR number, company, destination, quantity, and freight rate.", "Enter advance and fuel details where applicable; verify the calculated amount and balance.", "Review all entries, then select Save Record. A success message confirms that it was stored."] },
  { title: "Find and review records", items: ["Open Reports from the navigation bar.", "Enter a vehicle number, LR number, or freight memo number in the Search field.", "Optionally select a date range, party, transporter, company, destination, amount range, or balance status.", "Select Apply Filter to load matching records.", "Use pagination, column selection, and sorting to review the results."] },
  { title: "Export a report", items: ["Open Reports and apply the filters for the records you need.", "Select the report columns you want to include.", "Review the filtered records and summary cards.", "Select Download Excel to save the current report as an Excel workbook.", "Use the PDF download action when you need a printable report snapshot."] },
  { title: "Track and clear payments", items: ["Open Reports and apply filters to find unpaid records.", "Tick the checkbox beside each record that has been paid.", "Enter the payment-clearance date, if required.", "Confirm the selected-record count is correct.", "Select Clear Selected Payments. The selected balances are marked as paid."] },
  { title: "Check a party statement", items: ["Choose Party Statement from the navigation bar.", "Select or search for the required party.", "Set a date range if you only need a specific period.", "Review the listed transactions, paid amounts, and outstanding balance.", "Use the statement details for follow-up or payment reconciliation."] },
  { title: "Use the records assistant", items: ["Select Ask records at the bottom-right of any signed-in page.", "Type a question about a freight memo, vehicle, LR number, party, or transporter.", "Examples: Show freight memo 1024; Find LR 55; Show records for Acme Traders.", "Ask summary questions such as What is the total unpaid balance? or What is total fuel expense?", "Read the live answer based on currently stored transport records, then refine your question if needed."] },
];

export default function Help() {
  return (
    <>
      <Navbar />
      <PageContainer title="Help centre" subtitle="A simple guide to recording, finding, reporting, and clearing transport transactions.">
        <div className="grid gap-5 lg:grid-cols-2">
          {guides.map((guide, guideIndex) => (
            <article key={guide.title} className="glass-panel flex gap-5 p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 font-bold text-white shadow-lg shadow-blue-500/25">{guideIndex + 1}</span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{guide.title}</h2>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {guide.items.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
            </article>
          ))}
        </div>
        <div className="glass-panel mt-6 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Useful assistant questions</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">“Show freight memo 1024”, “What is the balance for vehicle MH12AB1234?”, “Find LR 55”, “Show records for Acme Traders”, or “What is the total unpaid balance?”</p>
        </div>
      </PageContainer>
    </>
  );
}
