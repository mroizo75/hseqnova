/**
 * Norwegian Fiken integration removed. UK billing is Stripe only.
 */
export class FikenClient {
  constructor(_config: { apiToken: string; companySlug: string }) {}

  async getInvoice(_invoiceId: string): Promise<never> {
    throw { code: "FIKEN_REMOVED", message: "Fiken is not used in HSEQ Nova. Use Stripe." };
  }

  async getSale(_saleId: string): Promise<never> {
    throw { code: "FIKEN_REMOVED", message: "Fiken is not used in HSEQ Nova. Use Stripe." };
  }
}
