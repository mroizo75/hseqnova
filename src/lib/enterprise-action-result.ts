export function actionMessage(result: { success: boolean; error?: string }, okText: string): string {
  if (!result.success) return result.error ?? "Something went wrong";
  return okText;
}
