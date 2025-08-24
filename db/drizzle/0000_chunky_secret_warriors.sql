-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"orgid" uuid,
	"id" varchar(255),
	"title" varchar(255),
	"name" varchar(255),
	"initials" varchar(255),
	"surname" varchar(255),
	"date_of_birth" date,
	"gender" varchar(255),
	"cell_phone" varchar(255),
	"additional_name" varchar(255),
	"additional_cell" varchar(255),
	"email" varchar(255),
	"address" text,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "injury_on_duty" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"company_name" varchar(255),
	"contact_person" varchar(255),
	"contact_number" varchar(255),
	"contact_email" varchar(255),
	"created_date" timestamp(6),
	"fileid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"orgid" uuid,
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "logo_table" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"filename" varchar(255),
	"file_location" text,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"orgid" uuid,
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "organization_info" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"practice_name" varchar(255),
	"bhf_number" varchar(255),
	"hpcsa" varchar(255),
	"practice_type" varchar(255),
	"vat_no" varchar(255),
	"address" text,
	"postal" text,
	"practice_telephone" varchar(255),
	"accounts_telephone" varchar(255),
	"cell" varchar(255),
	"fax" varchar(255),
	"email" varchar(255),
	"consent_to_treatment" text,
	"consent_to_financial_responsibility" text,
	"consent_to_release_of_information" text,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "medical_scheme" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"scheme_name" varchar(255),
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"orgid" uuid,
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "file_info" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"file_number" varchar(255),
	"account_number" varchar(255),
	"billing_account_no" varchar(255),
	"referral_doc_name" varchar(255),
	"referral_doc_number" varchar(255),
	"consent1" boolean,
	"consent2" boolean,
	"consent3" boolean,
	"orgid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "fileinfo_patient" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"patientid" uuid,
	"fileid" uuid,
	"orgid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"orgid" uuid,
	"type" varchar(255),
	"time_stamp" timestamp(6),
	"destination" varchar(255),
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "organization_payment_details" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"orgid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "person_responsible" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"orgid" uuid,
	"person_type" varchar(255),
	"fileid" uuid,
	"personid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "tab_files" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"orgid" uuid,
	"tab_notes_id" uuid,
	"file_name" varchar(255),
	"file_type" varchar(255),
	"file_location" text,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"userid" uuid,
	"roleid" uuid,
	"orgid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "user_calendar_entries" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"user_uid" uuid,
	"startdate" timestamp(6),
	"length" integer,
	"description" varchar(255),
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"orgid" uuid,
	"locked" boolean,
	"enddate" timestamp(6),
	"title" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "patientmedicalaid_file_patient" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"patient_medical_aid_id" uuid,
	"fileid" uuid,
	"patientid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"orgid" uuid,
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "Practice_Types" (
	"uuid" uuid PRIMARY KEY NOT NULL,
	"codes" text,
	"name" text,
	"active" boolean,
	"last_edit" timestamp,
	"date_created" timestamp
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"role_name" varchar(255),
	"description" text,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "users" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"first_name" varchar(255),
	"surname" varchar(255),
	"cell_no" varchar(255),
	"secret_key" varchar(255),
	"email" varchar(255),
	"username" varchar(255),
	"login_key" varchar(255),
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"orgid" uuid,
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "patient_medical_aid" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"medical_scheme_id" uuid,
	"membership_number" varchar(255),
	"patient_dependant_code" varchar(255),
	"patient_or_not" varchar(255),
	"fileid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"orgid" uuid,
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "signature" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"userid" uuid,
	"filename" varchar(255),
	"file_location" text,
	"orgid" uuid,
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
CREATE TABLE "tab_notes" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"orgid" uuid,
	"fileinfo_patient_id" uuid,
	"personid" uuid,
	"time_stamp" timestamp(6),
	"notes" text,
	"tab_type" varchar(255),
	"active" boolean,
	"date_created" timestamp(6),
	"last_edit" timestamp(6),
	"locked" boolean
);
--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injury_on_duty" ADD CONSTRAINT "injury_on_duty_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injury_on_duty" ADD CONSTRAINT "injury_on_duty_file_info_fk" FOREIGN KEY ("fileid") REFERENCES "public"."file_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logo_table" ADD CONSTRAINT "logo_table_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_info" ADD CONSTRAINT "file_info_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fileinfo_patient" ADD CONSTRAINT "fileinfo_patient_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fileinfo_patient" ADD CONSTRAINT "fileinfo_patient_patient_fk" FOREIGN KEY ("patientid") REFERENCES "public"."patient"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fileinfo_patient" ADD CONSTRAINT "fileinfo_patient_file_info_fk" FOREIGN KEY ("fileid") REFERENCES "public"."file_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_payment_details" ADD CONSTRAINT "organization_payment_details_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_responsible" ADD CONSTRAINT "person_responsible_file_info_fk" FOREIGN KEY ("fileid") REFERENCES "public"."file_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_responsible" ADD CONSTRAINT "person_responsible_patient_fk" FOREIGN KEY ("personid") REFERENCES "public"."patient"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_responsible" ADD CONSTRAINT "person_responsible_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_files" ADD CONSTRAINT "tab_files_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_files" ADD CONSTRAINT "tab_files_tab_notes_fk" FOREIGN KEY ("tab_notes_id") REFERENCES "public"."tab_notes"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_users_fk" FOREIGN KEY ("userid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roles_fk" FOREIGN KEY ("roleid") REFERENCES "public"."roles"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_calendar_entries" ADD CONSTRAINT "user_calendar_entries_users_fk" FOREIGN KEY ("user_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_calendar_entries" ADD CONSTRAINT "user_calendar_entries_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientmedicalaid_file_patient" ADD CONSTRAINT "patientmedicalaid_file_patient_file_info_fk" FOREIGN KEY ("fileid") REFERENCES "public"."file_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientmedicalaid_file_patient" ADD CONSTRAINT "patientmedicalaid_file_patient_patient_fk" FOREIGN KEY ("patientid") REFERENCES "public"."patient"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientmedicalaid_file_patient" ADD CONSTRAINT "patientmedicalaid_file_patient_patient_medical_aid_fk" FOREIGN KEY ("patient_medical_aid_id") REFERENCES "public"."patient_medical_aid"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientmedicalaid_file_patient" ADD CONSTRAINT "patientmedicalaid_file_patient_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medical_aid" ADD CONSTRAINT "patient_medical_aid_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medical_aid" ADD CONSTRAINT "patient_medical_aid_medical_scheme_fk" FOREIGN KEY ("medical_scheme_id") REFERENCES "public"."medical_scheme"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medical_aid" ADD CONSTRAINT "patient_medical_aid_file_info_fk" FOREIGN KEY ("fileid") REFERENCES "public"."file_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature" ADD CONSTRAINT "signature_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature" ADD CONSTRAINT "signature_users_fk" FOREIGN KEY ("userid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_notes" ADD CONSTRAINT "tab_notes_fileinfo_patient_fk" FOREIGN KEY ("fileinfo_patient_id") REFERENCES "public"."fileinfo_patient"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_notes" ADD CONSTRAINT "tab_notes_patient_fk" FOREIGN KEY ("personid") REFERENCES "public"."patient"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_notes" ADD CONSTRAINT "tab_notes_organization_info_fk" FOREIGN KEY ("orgid") REFERENCES "public"."organization_info"("uid") ON DELETE no action ON UPDATE no action;
*/