import {
	boolean,
	date,
	foreignKey,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

// ===== TABLE DEFINITIONS =====

export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: "string" }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp("rolled_back_at", {
		withTimezone: true,
		mode: "string",
	}),
	startedAt: timestamp("started_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const organizationInfo = pgTable("organization_info", {
	uid: uuid().primaryKey().notNull(),
	practiceName: varchar("practice_name", { length: 255 }),
	bhfNumber: varchar("bhf_number", { length: 255 }),
	hpcsa: varchar({ length: 255 }),
	practiceType: varchar("practice_type", { length: 255 }),
	vatNo: varchar("vat_no", { length: 255 }),
	address: text(),
	postal: text(),
	practiceTelephone: varchar("practice_telephone", { length: 255 }),
	accountsTelephone: varchar("accounts_telephone", { length: 255 }),
	cell: varchar({ length: 255 }),
	fax: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	consentToTreatment: text("consent_to_treatment"),
	consentToFinancialResponsibility: text("consent_to_financial_responsibility"),
	consentToReleaseOfInformation: text("consent_to_release_of_information"),
	active: boolean(),
	dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
	lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
	locked: boolean(),
});

export const practiceTypes = pgTable("Practice_Types", {
	uuid: uuid().primaryKey().notNull(),
	codes: text(),
	name: text(),
	active: boolean(),
	lastEdit: timestamp("last_edit", { mode: "string" }),
	dateCreated: timestamp("date_created", { mode: "string" }),
});

export const roles = pgTable("roles", {
	uid: uuid().primaryKey().notNull(),
	roleName: varchar("role_name", { length: 255 }),
	description: text(),
	active: boolean(),
	dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
	lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
	locked: boolean(),
});

export const users = pgTable(
	"users",
	{
		uid: uuid().primaryKey().notNull(),
		title: varchar({ length: 255 }),
		firstName: varchar("first_name", { length: 255 }),
		surname: varchar({ length: 255 }),
		cellNo: varchar("cell_no", { length: 255 }),
		secretKey: varchar("secret_key", { length: 255 }),
		email: varchar({ length: 255 }),
		username: varchar({ length: 255 }),
		loginKey: varchar("login_key", { length: 255 }),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		orgid: uuid(),
		roleId: uuid("role_id"), // Direct role assignment
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "users_organization_info_fk",
		}),
		foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.uid],
			name: "users_role_fk",
		}),
	],
);

export const userRoles = pgTable(
	"user_roles",
	{
		uid: uuid().primaryKey().notNull(),
		userid: uuid(),
		roleid: uuid(),
		orgid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.userid],
			foreignColumns: [users.uid],
			name: "user_roles_users_fk",
		}),
		foreignKey({
			columns: [table.roleid],
			foreignColumns: [roles.uid],
			name: "user_roles_roles_fk",
		}),
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "user_roles_organization_info_fk",
		}),
	],
);

export const patient = pgTable(
	"patient",
	{
		uid: uuid().primaryKey().notNull(),
		orgid: uuid(),
		id: varchar({ length: 255 }),
		title: varchar({ length: 255 }),
		name: varchar({ length: 255 }),
		initials: varchar({ length: 255 }),
		surname: varchar({ length: 255 }),
		dateOfBirth: date("date_of_birth"),
		gender: varchar({ length: 255 }),
		cellPhone: varchar("cell_phone", { length: 255 }),
		additionalName: varchar("additional_name", { length: 255 }),
		additionalCell: varchar("additional_cell", { length: 255 }),
		email: varchar({ length: 255 }),
		address: text(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "patient_organization_info_fk",
		}),
	],
);

export const medicalScheme = pgTable("medical_scheme", {
	uid: uuid().primaryKey().notNull(),
	schemeName: varchar("scheme_name", { length: 255 }),
	active: boolean(),
	dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
	lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
	orgid: uuid(),
	locked: boolean(),
});

export const fileInfo = pgTable(
	"file_info",
	{
		uid: uuid().primaryKey().notNull(),
		fileNumber: varchar("file_number", { length: 255 }),
		accountNumber: varchar("account_number", { length: 255 }),
		billingAccountNo: varchar("billing_account_no", { length: 255 }),
		referralDocName: varchar("referral_doc_name", { length: 255 }),
		referralDocNumber: varchar("referral_doc_number", { length: 255 }),
		consent1: boolean(),
		consent2: boolean(),
		consent3: boolean(),
		orgid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "file_info_organization_info_fk",
		}),
	],
);

export const fileinfoPatient = pgTable(
	"fileinfo_patient",
	{
		uid: uuid().primaryKey().notNull(),
		patientid: uuid(),
		fileid: uuid(),
		orgid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "fileinfo_patient_organization_info_fk",
		}),
		foreignKey({
			columns: [table.patientid],
			foreignColumns: [patient.uid],
			name: "fileinfo_patient_patient_fk",
		}),
		foreignKey({
			columns: [table.fileid],
			foreignColumns: [fileInfo.uid],
			name: "fileinfo_patient_file_info_fk",
		}),
	],
);

export const patientMedicalAid = pgTable(
	"patient_medical_aid",
	{
		uid: uuid().primaryKey().notNull(),
		medicalSchemeId: uuid("medical_scheme_id"),
		membershipNumber: varchar("membership_number", { length: 255 }),
		patientDependantCode: varchar("patient_dependant_code", { length: 255 }),
		patientOrNot: varchar("patient_or_not", { length: 255 }),
		fileid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		orgid: uuid(),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "patient_medical_aid_organization_info_fk",
		}),
		foreignKey({
			columns: [table.medicalSchemeId],
			foreignColumns: [medicalScheme.uid],
			name: "patient_medical_aid_medical_scheme_fk",
		}),
		foreignKey({
			columns: [table.fileid],
			foreignColumns: [fileInfo.uid],
			name: "patient_medical_aid_file_info_fk",
		}),
	],
);

export const patientmedicalaidFilePatient = pgTable(
	"patientmedicalaid_file_patient",
	{
		uid: uuid().primaryKey().notNull(),
		patientMedicalAidId: uuid("patient_medical_aid_id"),
		fileid: uuid(),
		patientid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		orgid: uuid(),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.fileid],
			foreignColumns: [fileInfo.uid],
			name: "patientmedicalaid_file_patient_file_info_fk",
		}),
		foreignKey({
			columns: [table.patientid],
			foreignColumns: [patient.uid],
			name: "patientmedicalaid_file_patient_patient_fk",
		}),
		foreignKey({
			columns: [table.patientMedicalAidId],
			foreignColumns: [patientMedicalAid.uid],
			name: "patientmedicalaid_file_patient_patient_medical_aid_fk",
		}),
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "patientmedicalaid_file_patient_organization_info_fk",
		}),
	],
);

export const personResponsible = pgTable(
	"person_responsible",
	{
		uid: uuid().primaryKey().notNull(),
		orgid: uuid(),
		personType: varchar("person_type", { length: 255 }),
		fileid: uuid(),
		personid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.fileid],
			foreignColumns: [fileInfo.uid],
			name: "person_responsible_file_info_fk",
		}),
		foreignKey({
			columns: [table.personid],
			foreignColumns: [patient.uid],
			name: "person_responsible_patient_fk",
		}),
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "person_responsible_organization_info_fk",
		}),
	],
);

export const injuryOnDuty = pgTable(
	"injury_on_duty",
	{
		uid: uuid().primaryKey().notNull(),
		companyName: varchar("company_name", { length: 255 }),
		contactPerson: varchar("contact_person", { length: 255 }),
		contactNumber: varchar("contact_number", { length: 255 }),
		contactEmail: varchar("contact_email", { length: 255 }),
		createdDate: timestamp("created_date", { precision: 6, mode: "string" }),
		fileid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		orgid: uuid(),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "injury_on_duty_organization_info_fk",
		}),
		foreignKey({
			columns: [table.fileid],
			foreignColumns: [fileInfo.uid],
			name: "injury_on_duty_file_info_fk",
		}),
	],
);

export const tabNotes = pgTable(
	"tab_notes",
	{
		uid: uuid().primaryKey().notNull(),
		orgid: uuid(),
		fileinfoPatientId: uuid("fileinfo_patient_id"),
		personid: uuid(),
		timeStamp: timestamp("time_stamp", { precision: 6, mode: "string" }),
		notes: text(),
		tabType: varchar("tab_type", { length: 255 }),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.fileinfoPatientId],
			foreignColumns: [fileinfoPatient.uid],
			name: "tab_notes_fileinfo_patient_fk",
		}),
		foreignKey({
			columns: [table.personid],
			foreignColumns: [patient.uid],
			name: "tab_notes_patient_fk",
		}),
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "tab_notes_organization_info_fk",
		}),
	],
);

export const tabFiles = pgTable(
	"tab_files",
	{
		uid: uuid().primaryKey().notNull(),
		orgid: uuid(),
		tabNotesId: uuid("tab_notes_id"),
		fileName: varchar("file_name", { length: 255 }),
		fileType: varchar("file_type", { length: 255 }),
		fileLocation: text("file_location"),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "tab_files_organization_info_fk",
		}),
		foreignKey({
			columns: [table.tabNotesId],
			foreignColumns: [tabNotes.uid],
			name: "tab_files_tab_notes_fk",
		}),
	],
);

export const userCalendarEntries = pgTable(
	"user_calendar_entries",
	{
		uid: uuid().primaryKey().notNull(),
		userUid: uuid("user_uid"),
		startdate: timestamp({ precision: 6, mode: "string" }),
		length: integer(),
		description: varchar({ length: 255 }),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		orgid: uuid(),
		locked: boolean(),
		enddate: timestamp({ precision: 6, mode: "string" }),
		title: varchar({ length: 255 }),
	},
	(table) => [
		foreignKey({
			columns: [table.userUid],
			foreignColumns: [users.uid],
			name: "user_calendar_entries_users_fk",
		}),
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "user_calendar_entries_organization_info_fk",
		}),
	],
);

export const logoTable = pgTable(
	"logo_table",
	{
		uid: uuid().primaryKey().notNull(),
		filename: varchar({ length: 255 }),
		fileLocation: text("file_location"),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		orgid: uuid(),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "logo_table_organization_info_fk",
		}),
	],
);

export const notifications = pgTable(
	"notifications",
	{
		uid: uuid().primaryKey().notNull(),
		orgid: uuid(),
		type: varchar({ length: 255 }),
		timeStamp: timestamp("time_stamp", { precision: 6, mode: "string" }),
		destination: varchar({ length: 255 }),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "notifications_organization_info_fk",
		}),
	],
);

export const organizationPaymentDetails = pgTable(
	"organization_payment_details",
	{
		uid: uuid().primaryKey().notNull(),
		orgid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "organization_payment_details_organization_info_fk",
		}),
	],
);

export const signature = pgTable(
	"signature",
	{
		uid: uuid().primaryKey().notNull(),
		userid: uuid(),
		filename: varchar({ length: 255 }),
		fileLocation: text("file_location"),
		orgid: uuid(),
		active: boolean(),
		dateCreated: timestamp("date_created", { precision: 6, mode: "string" }),
		lastEdit: timestamp("last_edit", { precision: 6, mode: "string" }),
		locked: boolean(),
	},
	(table) => [
		foreignKey({
			columns: [table.orgid],
			foreignColumns: [organizationInfo.uid],
			name: "signature_organization_info_fk",
		}),
		foreignKey({
			columns: [table.userid],
			foreignColumns: [users.uid],
			name: "signature_users_fk",
		}),
	],
);

// ===== RELATIONS =====

export const organizationInfoRelations = relations(
	organizationInfo,
	({ many }) => ({
		patients: many(patient),
		injuryOnDuties: many(injuryOnDuty),
		logoTables: many(logoTable),
		fileInfos: many(fileInfo),
		fileinfoPatients: many(fileinfoPatient),
		notifications: many(notifications),
		organizationPaymentDetails: many(organizationPaymentDetails),
		personResponsibles: many(personResponsible),
		tabFiles: many(tabFiles),
		userRoles: many(userRoles),
		userCalendarEntries: many(userCalendarEntries),
		patientmedicalaidFilePatients: many(patientmedicalaidFilePatient),
		users: many(users),
		patientMedicalAids: many(patientMedicalAid),
		signatures: many(signature),
		tabNotes: many(tabNotes),
	}),
);

export const usersRelations = relations(users, ({ one, many }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [users.orgid],
		references: [organizationInfo.uid],
	}),
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.uid],
	}),
	userRoles: many(userRoles),
	userCalendarEntries: many(userCalendarEntries),
	signatures: many(signature),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	users: many(users),
	userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, {
		fields: [userRoles.userid],
		references: [users.uid],
	}),
	role: one(roles, {
		fields: [userRoles.roleid],
		references: [roles.uid],
	}),
	organizationInfo: one(organizationInfo, {
		fields: [userRoles.orgid],
		references: [organizationInfo.uid],
	}),
}));

export const patientRelations = relations(patient, ({ one, many }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [patient.orgid],
		references: [organizationInfo.uid],
	}),
	fileinfoPatients: many(fileinfoPatient),
	personResponsibles: many(personResponsible),
	patientmedicalaidFilePatients: many(patientmedicalaidFilePatient),
	tabNotes: many(tabNotes),
}));

export const medicalSchemeRelations = relations(medicalScheme, ({ many }) => ({
	patientMedicalAids: many(patientMedicalAid),
}));

export const fileInfoRelations = relations(fileInfo, ({ one, many }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [fileInfo.orgid],
		references: [organizationInfo.uid],
	}),
	injuryOnDuties: many(injuryOnDuty),
	fileinfoPatients: many(fileinfoPatient),
	personResponsibles: many(personResponsible),
	patientmedicalaidFilePatients: many(patientmedicalaidFilePatient),
	patientMedicalAids: many(patientMedicalAid),
}));

export const fileinfoPatientRelations = relations(
	fileinfoPatient,
	({ one, many }) => ({
		organizationInfo: one(organizationInfo, {
			fields: [fileinfoPatient.orgid],
			references: [organizationInfo.uid],
		}),
		patient: one(patient, {
			fields: [fileinfoPatient.patientid],
			references: [patient.uid],
		}),
		fileInfo: one(fileInfo, {
			fields: [fileinfoPatient.fileid],
			references: [fileInfo.uid],
		}),
		tabNotes: many(tabNotes),
	}),
);

export const patientMedicalAidRelations = relations(
	patientMedicalAid,
	({ one, many }) => ({
		organizationInfo: one(organizationInfo, {
			fields: [patientMedicalAid.orgid],
			references: [organizationInfo.uid],
		}),
		medicalScheme: one(medicalScheme, {
			fields: [patientMedicalAid.medicalSchemeId],
			references: [medicalScheme.uid],
		}),
		fileInfo: one(fileInfo, {
			fields: [patientMedicalAid.fileid],
			references: [fileInfo.uid],
		}),
		patientmedicalaidFilePatients: many(patientmedicalaidFilePatient),
	}),
);

export const patientmedicalaidFilePatientRelations = relations(
	patientmedicalaidFilePatient,
	({ one }) => ({
		fileInfo: one(fileInfo, {
			fields: [patientmedicalaidFilePatient.fileid],
			references: [fileInfo.uid],
		}),
		patient: one(patient, {
			fields: [patientmedicalaidFilePatient.patientid],
			references: [patient.uid],
		}),
		patientMedicalAid: one(patientMedicalAid, {
			fields: [patientmedicalaidFilePatient.patientMedicalAidId],
			references: [patientMedicalAid.uid],
		}),
		organizationInfo: one(organizationInfo, {
			fields: [patientmedicalaidFilePatient.orgid],
			references: [organizationInfo.uid],
		}),
	}),
);

export const personResponsibleRelations = relations(
	personResponsible,
	({ one }) => ({
		fileInfo: one(fileInfo, {
			fields: [personResponsible.fileid],
			references: [fileInfo.uid],
		}),
		patient: one(patient, {
			fields: [personResponsible.personid],
			references: [patient.uid],
		}),
		organizationInfo: one(organizationInfo, {
			fields: [personResponsible.orgid],
			references: [organizationInfo.uid],
		}),
	}),
);

export const injuryOnDutyRelations = relations(injuryOnDuty, ({ one }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [injuryOnDuty.orgid],
		references: [organizationInfo.uid],
	}),
	fileInfo: one(fileInfo, {
		fields: [injuryOnDuty.fileid],
		references: [fileInfo.uid],
	}),
}));

export const tabNotesRelations = relations(tabNotes, ({ one, many }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [tabNotes.orgid],
		references: [organizationInfo.uid],
	}),
	fileinfoPatient: one(fileinfoPatient, {
		fields: [tabNotes.fileinfoPatientId],
		references: [fileinfoPatient.uid],
	}),
	patient: one(patient, {
		fields: [tabNotes.personid],
		references: [patient.uid],
	}),
	tabFiles: many(tabFiles),
}));

export const tabFilesRelations = relations(tabFiles, ({ one }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [tabFiles.orgid],
		references: [organizationInfo.uid],
	}),
	tabNote: one(tabNotes, {
		fields: [tabFiles.tabNotesId],
		references: [tabNotes.uid],
	}),
}));

export const userCalendarEntriesRelations = relations(
	userCalendarEntries,
	({ one }) => ({
		user: one(users, {
			fields: [userCalendarEntries.userUid],
			references: [users.uid],
		}),
		organizationInfo: one(organizationInfo, {
			fields: [userCalendarEntries.orgid],
			references: [organizationInfo.uid],
		}),
	}),
);

export const logoTableRelations = relations(logoTable, ({ one }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [logoTable.orgid],
		references: [organizationInfo.uid],
	}),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [notifications.orgid],
		references: [organizationInfo.uid],
	}),
}));

export const organizationPaymentDetailsRelations = relations(
	organizationPaymentDetails,
	({ one }) => ({
		organizationInfo: one(organizationInfo, {
			fields: [organizationPaymentDetails.orgid],
			references: [organizationInfo.uid],
		}),
	}),
);

export const signatureRelations = relations(signature, ({ one }) => ({
	organizationInfo: one(organizationInfo, {
		fields: [signature.orgid],
		references: [organizationInfo.uid],
	}),
	user: one(users, {
		fields: [signature.userid],
		references: [users.uid],
	}),
}));

// ===== SCHEMA EXPORT =====

export const schema = {
	// Core Organization
	organizationInfo,
	organizationPaymentDetails,
	practiceTypes,

	// Users & Roles
	users,
	roles,
	userRoles,

	// Patients & Medical
	patient,
	medicalScheme,
	patientMedicalAid,
	patientmedicalaidFilePatient,

	// Files & Data
	fileInfo,
	fileinfoPatient,
	personResponsible,
	injuryOnDuty,

	// Notes & Files
	tabNotes,
	tabFiles,

	// Calendar
	userCalendarEntries,

	// System & Assets
	logoTable,
	notifications,
	signature,

	// Prisma Migration History
	prismaMigrations,

	// Relations
	organizationInfoRelations,
	usersRelations,
	rolesRelations,
	userRolesRelations,
	patientRelations,
	medicalSchemeRelations,
	fileInfoRelations,
	fileinfoPatientRelations,
	patientMedicalAidRelations,
	patientmedicalaidFilePatientRelations,
	personResponsibleRelations,
	injuryOnDutyRelations,
	tabNotesRelations,
	tabFilesRelations,
	userCalendarEntriesRelations,
	logoTableRelations,
	notificationsRelations,
	organizationPaymentDetailsRelations,
	signatureRelations,
};

// ===== TYPE EXPORTS =====

export type Database = typeof schema;
