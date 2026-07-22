"use client";

import { InstructorDetailsView } from "@/components/instructors/instructor-details-view";

export default function InstructorDetailsPage({ params }: { params: { id: string } }) {
  return <InstructorDetailsView id={params.id} />;
}

