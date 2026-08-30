-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" TYPE BIGINT USING "id"::bigint;
ALTER TABLE "users"
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "averageRating" TEXT NOT NULL DEFAULT '0.0',
ADD COLUMN     "badges" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "contributionScore" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "eventScore" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "github" TEXT,
ADD COLUMN     "isReviewer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joined" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "portfolio" TEXT,
ADD COLUMN     "projectRatingScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "projectsUploaded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recentProjects" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "registerNumber" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "totalScore" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "id" BIGINT NOT NULL;

-- CreateTable
CREATE TABLE "projects" (
    "id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Web Development',
    "problemStatement" TEXT,
    "solution" TEXT,
    "screenshots" JSONB NOT NULL DEFAULT '[]',
    "demoVideoUrl" TEXT,
    "github" TEXT,
    "deployment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "owner" TEXT,
    "rating" TEXT NOT NULL DEFAULT '0.0',
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "contributors" TEXT,
    "submissionDate" TEXT,
    "technologiesUsed" JSONB NOT NULL DEFAULT '[]',
    "awards" JSONB NOT NULL DEFAULT '[]',
    "individualRatings" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_ratings" (
    "id" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    "adminId" BIGINT NOT NULL,
    "adminName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_applications" (
    "id" BIGINT NOT NULL,
    "recruitmentId" TEXT NOT NULL DEFAULT 'recruitment-2026',
    "name" TEXT NOT NULL,
    "registerNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "domain" TEXT,
    "firstPreference" TEXT,
    "secondPreference" TEXT,
    "firstPrefReason" TEXT,
    "secondPrefReason" TEXT,
    "yearOfStudy" TEXT NOT NULL,
    "technicalSkills" JSONB DEFAULT '[]',
    "skillLevel" TEXT,
    "github" TEXT,
    "linkedin" TEXT,
    "portfolio" TEXT,
    "sevenDaysBuild" TEXT,
    "skillToLearn" TEXT,
    "whyHackclub" TEXT,
    "expectations" TEXT,
    "productiveWebsiteQuestions" TEXT,
    "threeDaysProjectTradeoffs" TEXT,
    "anythingElse" TEXT,
    "whyJoin" TEXT,
    "projectDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "appliedDate" TEXT,
    "decided_by" BIGINT,
    "decided_at" TIMESTAMP(3),
    "decision_reason" TEXT,

    CONSTRAINT "recruitment_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowed_emails" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allowed_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "recruitment_role_assignments" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'NONE',
    "departments" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitment_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_forms" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "recruitment_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_form_questions" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" TEXT[],

    CONSTRAINT "recruitment_form_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_form_submissions" (
    "id" SERIAL NOT NULL,
    "application_id" BIGINT NOT NULL,
    "form_id" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_form_answers" (
    "id" SERIAL NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "recruitment_form_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_panels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_panel_members" (
    "id" SERIAL NOT NULL,
    "panel_id" INTEGER NOT NULL,
    "user_id" BIGINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recruitment_panel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_interviews" (
    "id" SERIAL NOT NULL,
    "application_id" BIGINT NOT NULL,
    "panel_id" INTEGER NOT NULL,
    "recruiter_id" BIGINT,
    "round" INTEGER NOT NULL DEFAULT 1,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "meeting_link" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "recruitment_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_feedback" (
    "id" SERIAL NOT NULL,
    "interview_id" INTEGER NOT NULL,
    "panel_member_id" INTEGER NOT NULL,
    "technical_score" INTEGER NOT NULL,
    "communication_score" INTEGER NOT NULL,
    "problem_solving_score" INTEGER NOT NULL,
    "confidence_score" INTEGER NOT NULL,
    "teamwork_score" INTEGER NOT NULL,
    "comments" TEXT,
    "decision" TEXT NOT NULL,

    CONSTRAINT "recruitment_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_notifications" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_ratings_projectId_adminId_key" ON "project_ratings"("projectId", "adminId");

-- CreateIndex
CREATE INDEX "recruitment_applications_recruitmentId_idx" ON "recruitment_applications"("recruitmentId");

-- CreateIndex
CREATE INDEX "recruitment_applications_status_idx" ON "recruitment_applications"("status");

-- CreateIndex
CREATE INDEX "recruitment_applications_domain_idx" ON "recruitment_applications"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_applications_recruitmentId_email_key" ON "recruitment_applications"("recruitmentId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_applications_recruitmentId_registerNumber_key" ON "recruitment_applications"("recruitmentId", "registerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "allowed_emails_email_key" ON "allowed_emails"("email");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_role_assignments_user_id_key" ON "recruitment_role_assignments"("user_id");

-- CreateIndex
CREATE INDEX "recruitment_role_assignments_role_idx" ON "recruitment_role_assignments"("role");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_form_submissions_application_id_key" ON "recruitment_form_submissions"("application_id");

-- CreateIndex
CREATE INDEX "recruitment_interviews_application_id_idx" ON "recruitment_interviews"("application_id");

-- CreateIndex
CREATE INDEX "recruitment_interviews_date_idx" ON "recruitment_interviews"("date");

-- CreateIndex
CREATE INDEX "recruitment_feedback_interview_id_idx" ON "recruitment_feedback"("interview_id");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_feedback_interview_id_panel_member_id_key" ON "recruitment_feedback"("interview_id", "panel_member_id");

-- CreateIndex
CREATE INDEX "recruitment_notifications_user_id_idx" ON "recruitment_notifications"("user_id");

-- CreateIndex
CREATE INDEX "recruitment_audit_logs_timestamp_idx" ON "recruitment_audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "recruitment_role_assignments" ADD CONSTRAINT "recruitment_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_form_questions" ADD CONSTRAINT "recruitment_form_questions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "recruitment_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_form_submissions" ADD CONSTRAINT "recruitment_form_submissions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "recruitment_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_form_submissions" ADD CONSTRAINT "recruitment_form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "recruitment_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_form_answers" ADD CONSTRAINT "recruitment_form_answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "recruitment_form_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_form_answers" ADD CONSTRAINT "recruitment_form_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "recruitment_form_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_panel_members" ADD CONSTRAINT "recruitment_panel_members_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "recruitment_panels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_panel_members" ADD CONSTRAINT "recruitment_panel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_interviews" ADD CONSTRAINT "recruitment_interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "recruitment_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_interviews" ADD CONSTRAINT "recruitment_interviews_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "recruitment_panels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_interviews" ADD CONSTRAINT "recruitment_interviews_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_feedback" ADD CONSTRAINT "recruitment_feedback_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "recruitment_interviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_feedback" ADD CONSTRAINT "recruitment_feedback_panel_member_id_fkey" FOREIGN KEY ("panel_member_id") REFERENCES "recruitment_panel_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_notifications" ADD CONSTRAINT "recruitment_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_audit_logs" ADD CONSTRAINT "recruitment_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterviewAssignments" ADD CONSTRAINT "_InterviewAssignments_A_fkey" FOREIGN KEY ("A") REFERENCES "recruitment_interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterviewAssignments" ADD CONSTRAINT "_InterviewAssignments_B_fkey" FOREIGN KEY ("B") REFERENCES "recruitment_panel_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
