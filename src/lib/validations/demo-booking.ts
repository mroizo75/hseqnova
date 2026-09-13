import { z } from "zod";

export const bookDemoSchema = z.object({
  startAt: z.string().datetime(),
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid work email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().min(2, "Company name is required").max(160),
  jobTitle: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  _hp: z.string().optional(),
});

export const rescheduleDemoSchema = z.object({
  startAt: z.string().datetime(),
});
