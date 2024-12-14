-- CreateTable
CREATE TABLE "diary" (
    "uid" UUID NOT NULL,
    "orgid" UUID,
    "userid" UUID,
    "appointment_type" VARCHAR(255),
    "description" TEXT,
    "start_time" TIMESTAMP(6),
    "end_time" TIMESTAMP(6),
    "title" VARCHAR(255),
    "colour" VARCHAR(255),
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "diary_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "file_info" (
    "uid" UUID NOT NULL,
    "file_number" VARCHAR(255),
    "account_number" VARCHAR(255),
    "billing_account_no" VARCHAR(255),
    "referral_doc_name" VARCHAR(255),
    "referral_doc_number" VARCHAR(255),
    "consent1" BOOLEAN,
    "consent2" BOOLEAN,
    "consent3" BOOLEAN,
    "orgid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "file_info_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "fileinfo_patient" (
    "uid" UUID NOT NULL,
    "patientid" UUID,
    "fileid" UUID,
    "orgid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "fileinfo_patient_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "injury_on_duty" (
    "uid" UUID NOT NULL,
    "company_name" VARCHAR(255),
    "contact_person" VARCHAR(255),
    "contact_number" VARCHAR(255),
    "contact_email" VARCHAR(255),
    "created_date" TIMESTAMP(6),
    "fileid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "orgid" UUID,
    "locked" BOOLEAN,

    CONSTRAINT "injury_on_duty_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "logo_table" (
    "uid" UUID NOT NULL,
    "filename" VARCHAR(255),
    "file_location" TEXT,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "orgid" UUID,
    "locked" BOOLEAN,

    CONSTRAINT "logo_table_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "medical_scheme" (
    "uid" UUID NOT NULL,
    "scheme_name" VARCHAR(255),
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "orgid" UUID,
    "locked" BOOLEAN,

    CONSTRAINT "medical_scheme_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "notifications" (
    "uid" UUID NOT NULL,
    "orgid" UUID,
    "type" VARCHAR(255),
    "time_stamp" TIMESTAMP(6),
    "destination" VARCHAR(255),
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "organization_info" (
    "uid" UUID NOT NULL,
    "practice_name" VARCHAR(255),
    "bhf_number" VARCHAR(255),
    "hpcsa" VARCHAR(255),
    "practice_type" VARCHAR(255),
    "vat_no" VARCHAR(255),
    "address" TEXT,
    "postal" TEXT,
    "practice_telephone" VARCHAR(255),
    "accounts_telephone" VARCHAR(255),
    "cell" VARCHAR(255),
    "fax" VARCHAR(255),
    "email" VARCHAR(255),
    "consent_to_treatment" TEXT,
    "consent_to_financial_responsibility" TEXT,
    "consent_to_release_of_information" TEXT,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "organization_info_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "organization_payment_details" (
    "uid" UUID NOT NULL,
    "orgid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "organization_payment_details_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "patient" (
    "uid" UUID NOT NULL,
    "orgid" UUID,
    "id" VARCHAR(255),
    "title" VARCHAR(255),
    "name" VARCHAR(255),
    "initials" VARCHAR(255),
    "surname" VARCHAR(255),
    "date_of_birth" DATE,
    "gender" VARCHAR(255),
    "cell_phone" VARCHAR(255),
    "additional_name" VARCHAR(255),
    "additional_cell" VARCHAR(255),
    "email" VARCHAR(255),
    "address" TEXT,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "patient_medical_aid" (
    "uid" UUID NOT NULL,
    "medical_scheme_id" UUID,
    "membership_number" VARCHAR(255),
    "patient_dependant_code" VARCHAR(255),
    "patient_or_not" VARCHAR(255),
    "fileid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "orgid" UUID,
    "locked" BOOLEAN,

    CONSTRAINT "patient_medical_aid_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "patientmedicalaid_file_patient" (
    "uid" UUID NOT NULL,
    "patient_medical_aid_id" UUID,
    "fileid" UUID,
    "patientid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "orgid" UUID,
    "locked" BOOLEAN,

    CONSTRAINT "patientmedicalaid_file_patient_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "person_responsible" (
    "uid" UUID NOT NULL,
    "orgid" UUID,
    "person_type" VARCHAR(255),
    "fileid" UUID,
    "personid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "person_responsible_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "roles" (
    "uid" UUID NOT NULL,
    "role_name" VARCHAR(255),
    "description" TEXT,
    "orgid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "signature" (
    "uid" UUID NOT NULL,
    "userid" UUID,
    "filename" VARCHAR(255),
    "file_location" TEXT,
    "orgid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "signature_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "tab_files" (
    "uid" UUID NOT NULL,
    "orgid" UUID,
    "tab_notes_id" UUID,
    "file_name" VARCHAR(255),
    "file_type" VARCHAR(255),
    "file_location" TEXT,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "tab_files_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "tab_notes" (
    "uid" UUID NOT NULL,
    "orgid" UUID,
    "fileinfo_patient_id" UUID,
    "personid" UUID,
    "time_stamp" TIMESTAMP(6),
    "notes" TEXT,
    "tab_type" VARCHAR(255),
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "tab_notes_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "uid" UUID NOT NULL,
    "userid" UUID,
    "roleid" UUID,
    "orgid" UUID,
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "locked" BOOLEAN,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "users" (
    "uid" UUID NOT NULL,
    "title" VARCHAR(255),
    "first_name" VARCHAR(255),
    "surname" VARCHAR(255),
    "cell_no" VARCHAR(255),
    "secret_key" VARCHAR(255),
    "email" VARCHAR(255),
    "username" VARCHAR(255),
    "login_key" VARCHAR(255),
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "orgid" UUID,
    "locked" BOOLEAN,

    CONSTRAINT "users_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "user_calendar_entries" (
    "uid" UUID NOT NULL,
    "user_uid" UUID,
    "date" TIMESTAMP(6),
    "length" INTEGER,
    "description" VARCHAR(255),
    "active" BOOLEAN,
    "date_created" TIMESTAMP(6),
    "last_edit" TIMESTAMP(6),
    "orgid" UUID,
    "locked" BOOLEAN,

    CONSTRAINT "user_calendar_entries_pkey" PRIMARY KEY ("uid")
);
