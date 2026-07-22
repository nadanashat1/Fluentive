import React from "react";

export function AddDealFooter({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eef0f4] pt-4 dark:border-[#1f2230]">
      <div>{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
