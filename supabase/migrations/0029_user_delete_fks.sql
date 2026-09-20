-- Allow superadmin to delete a User without losing organisation records.
-- Several FKs were ON DELETE RESTRICT (handbook signatures, risks, tickets),
-- and Measure/CustomerFeedback used CASCADE (would wipe HSEQ data).
-- Apply in the Supabase SQL editor. Do not prisma db push.

CREATE OR REPLACE FUNCTION hseq_user_fk_set_null(
  p_table text,
  p_column text,
  p_constraint text
) RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', p_table, p_column);
  EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', p_table, p_constraint);
  EXECUTE format(
    'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE',
    p_table,
    p_constraint,
    p_column
  );
END;
$$ LANGUAGE plpgsql;

SELECT hseq_user_fk_set_null('InvoiceExport', 'exportedById', 'InvoiceExport_exportedById_fkey');
SELECT hseq_user_fk_set_null('Risk', 'ownerId', 'Risk_ownerId_fkey');
SELECT hseq_user_fk_set_null('BlogPost', 'authorId', 'BlogPost_authorId_fkey');
SELECT hseq_user_fk_set_null('SupportTicket', 'createdById', 'SupportTicket_createdById_fkey');
SELECT hseq_user_fk_set_null('SupportMessage', 'senderUserId', 'SupportMessage_senderUserId_fkey');
SELECT hseq_user_fk_set_null('Project', 'createdById', 'Project_createdById_fkey');
SELECT hseq_user_fk_set_null('ConstructionRosterDailyCheck', 'checkedById', 'ConstructionRosterDailyCheck_checkedById_fkey');
SELECT hseq_user_fk_set_null('CrmActivity', 'createdById', 'CrmActivity_createdById_fkey');
SELECT hseq_user_fk_set_null('CrmTask', 'assignedToId', 'CrmTask_assignedToId_fkey');
SELECT hseq_user_fk_set_null('EmployeeReview', 'reviewerId', 'EmployeeReview_reviewerId_fkey');
SELECT hseq_user_fk_set_null('Measure', 'responsibleId', 'Measure_responsibleId_fkey');
SELECT hseq_user_fk_set_null('CustomerFeedback', 'recordedById', 'CustomerFeedback_recordedById_fkey');

DROP FUNCTION hseq_user_fk_set_null(text, text, text);

ALTER TABLE "HandbookSignature" DROP CONSTRAINT IF EXISTS "HandbookSignature_userId_fkey";
ALTER TABLE "HandbookSignature"
  ADD CONSTRAINT "HandbookSignature_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeReview" DROP CONSTRAINT IF EXISTS "EmployeeReview_employeeId_fkey";
ALTER TABLE "EmployeeReview"
  ADD CONSTRAINT "EmployeeReview_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'IsoClauseAssessment_responsibleUserId_fkey'
  ) THEN
    ALTER TABLE "IsoClauseAssessment"
      ADD CONSTRAINT "IsoClauseAssessment_responsibleUserId_fkey"
      FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;
