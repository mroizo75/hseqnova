"use server";

interface ProvisionIndustryPackageResult {
  success: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
}

/**
 * UK product: do not seed industry-specific risks, RAMS or menus.
 * Core HSEQ is the same for every employer (HSWA; MHSWR). Add-ons are bought separately.
 */
export async function provisionIndustryPackage(
  _tenantId: string
): Promise<ProvisionIndustryPackageResult> {
  return {
    success: true,
    skipped: true,
    message: "Industry packages are not used in the UK product",
  };
}
