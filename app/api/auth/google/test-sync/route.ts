import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const courseId = searchParams.get("courseId");

  if (!token || !courseId) {
    return NextResponse.json({ error: "Missing '?token=...' or '?courseId=...' in your browser URL." }, { status: 400 });
  }

  try {
    // ─── ACTION 1: READ EXISTING ANNOUNCEMENTS ───
    const readResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const initialAnnouncements = await readResponse.json();

    // ─── ACTION 2: PUSH (WRITE) A NEW ANNOUNCEMENT ───
    const writeAnnounceResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `Hello class! This announcement was posted automatically by polyglot on ${new Date().toLocaleTimeString()}!`,
        state: "PUBLISHED",
      }),
    });
    const createdAnnouncement = await writeAnnounceResponse.json();

    // ─── ACTION 3: PUSH (WRITE) A NEW ASSIGNMENT (COURSEWORK) ───
    const writeWorkResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `AP Java Homework ${Math.floor(Math.random() * 100)}`,
        description: "Complete Unit 2.1 Graded Coding Exercise on printing inside your polyglot workspace.",
        workType: "ASSIGNMENT",
        state: "PUBLISHED",
        maxPoints: 10,
      }),
    });
    const createdAssignment = await writeWorkResponse.json();

    // ─── ACTION 4: READ LATEST ANNOUNCEMENTS (PROVE THE UPDATE) ───
    const readLatestResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updatedAnnouncements = await readLatestResponse.json();

    // ─── RETURN THE PROOF ───
    return NextResponse.json({
      status: "SUCCESS! Two-way communication proven.",
      step1_initialAnnouncementsInClassroom: initialAnnouncements.announcements || [],
      step2_announcementWePushed: createdAnnouncement,
      step3_assignmentWePushed: createdAssignment,
      step4_updatedAnnouncementsInClassroom: updatedAnnouncements.announcements || []
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sync test failed." }, { status: 500 });
  }
}