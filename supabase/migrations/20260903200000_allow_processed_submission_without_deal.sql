-- A processed landing submission is historical capture data.
-- Its operational CRM deal may be removed later, so crm_deal_id is nullable
-- in this state while the processing timestamp and contact remain required.
alter table public.landing_submissions
  drop constraint if exists landing_submissions_processed_consistency;

alter table public.landing_submissions
  add constraint landing_submissions_processed_consistency
  check (
    status <> 'processed'
    or (
      processed_at is not null
      and crm_contact_id is not null
    )
  );
