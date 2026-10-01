"use client";

import { Suspense } from "react";
import { RoomsView } from "@/components/dashboard/RoomsView";

function MyRooms() {
  return (
    <RoomsView
      scope="mine"
      title="My Rooms"
      subtitle="Design rooms you own. Open one to keep designing or manage sharing."
      variant="card"
      emptyTitle="You don't own any rooms yet"
      emptyDescription="Rooms you create appear here with full owner controls."
    />
  );
}

export default function MyRoomsPage() {
  return (
    <Suspense fallback={null}>
      <MyRooms />
    </Suspense>
  );
}
