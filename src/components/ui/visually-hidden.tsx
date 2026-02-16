import * as React from "react";

import { cn } from "@/lib/utils";

function VisuallyHidden({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "sr-only",
        className
      )}
      {...props}
    />
  );
}

export { VisuallyHidden };
