/**
 * Next.js Instrumentation
 * Kjøres én gang ved oppstart (både server og edge runtime)
 * Perfekt for environment validering og global setup
 */

export async function register() {
  // Kun kjør på server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./src/lib/env');
    
    // Valider environment variables ved oppstart
    try {
      validateEnv();
    } catch (error) {
      console.error('Environment validation failed:', error);
      // I produksjon, stopp oppstart hvis kritiske variabler mangler
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
}
