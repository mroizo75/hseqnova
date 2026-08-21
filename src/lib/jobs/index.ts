import { scheduleInvoiceCheck, invoiceWorker } from "./invoice-checker";
import { scheduleReminderJobs, reminderWorker } from "./reminder-queue";

/**
 * Initialiser alle scheduled jobs
 * Kjøres når serveren starter
 */
export async function initializeJobs() {
  console.log("[Jobs] Initializing scheduled jobs...");

  try {
    await Promise.all([scheduleInvoiceCheck(), scheduleReminderJobs()]);
    
    console.log("[Jobs] All jobs initialized successfully");
  } catch (error) {
    console.error("[Jobs] Failed to initialize jobs:", error);
  }
}

// Export workers for cleanup
export { invoiceWorker, reminderWorker };

