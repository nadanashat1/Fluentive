import React from "react";

export function PipelineInfoFooterActions({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="w-full">{left}</div>
        <div className="w-full">{right}</div>
      </div>
    </div>
  );
}
