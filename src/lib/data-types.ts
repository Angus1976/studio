/**
 * @fileOverview This file contains the core data types and Zod schemas used across the application.
 * Separating these from server-side logic files prevents 'use server' directive violations.
 */

import { z } from 'zod';

export const TenantSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  adminEmail: z.string().email(),
  status: z.enum(["活跃", "待审核", "已禁用"]),
  registeredDate: z.string(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const IndividualUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.enum(["活跃", "待审核", "已禁用"]),
  tenantId: z.string().optional(),
  registeredDate: z.string(),
});
export type IndividualUser = z.infer<typeof IndividualUserSchema>;
