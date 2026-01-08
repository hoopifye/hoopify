-- AddedBy field to track who added a calendar member
ALTER TABLE "CalendarMember" ADD COLUMN "addedByUserId" TEXT;

-- Add foreign key constraint
ALTER TABLE "CalendarMember" ADD CONSTRAINT "CalendarMember_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
