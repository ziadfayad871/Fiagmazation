"use client";

import { Suspense } from "react";
import { RoomsView } from "@/components/dashboard/RoomsView";

function SharedRooms() {
  return (
    <RoomsView
      scope="shared"
      title="Shared With Me"
      subtitle="Rooms other people invited you to, with your access level."
      variant="card"
      emptyTitle="Nothing shared with you yet"
      emptyDescription="When somebody invites you to a room it shows up here instantly."
    />
  );
}

export default function SharedRoomsPage() {
  return (
    <Suspense fallback={null}>
      <SharedRooms />
    </Suspense>
  );
}
