import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kundaliSubmissions = pgTable("kundali_submissions", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  gender: text("gender").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  timeOfBirth: text("time_of_birth").notNull(),
  timeAccuracy: text("time_accuracy").notNull(),
  placeOfBirth: text("place_of_birth").notNull(),
  currentCity: text("current_city").notNull(),
  relationshipStatus: text("relationship_status").notNull(),
  careerField: text("career_field").notNull(),
  concerns: jsonb("concerns").$type<string[]>().notNull(),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertKundaliSubmissionSchema = createInsertSchema(kundaliSubmissions).omit({
  id: true,
  createdAt: true,
});

export type KundaliSubmission = typeof kundaliSubmissions.$inferSelect;
export type InsertKundaliSubmission = z.infer<typeof insertKundaliSubmissionSchema>;
