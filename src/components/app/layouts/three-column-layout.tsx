
"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

const ThreeColumnLayout = ({
  children,
  className,
  autoSaveId,
}: {
  children: React.ReactNode;
  className?: string;
  autoSaveId: string;
}) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("h-full max-h-full items-stretch", className)}
      autoSaveId={autoSaveId}
    >
      {children}
    </ResizablePanelGroup>
  );
};

const Left = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePanel>) => {
  return (
    <ResizablePanel
      className={cn(
        "h-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 !overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
    </ResizablePanel>
  );
};

const Main = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePanel>) => {
  return (
    <ResizablePanel
      className={cn(
        "h-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 !overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
    </ResizablePanel>
  );
};

const Right = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePanel>) => {
  return (
    <ResizablePanel
      className={cn(
        "h-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 !overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
    </ResizablePanel>
  );
};

ThreeColumnLayout.Left = Left;
ThreeColumnLayout.Main = Main;
ThreeColumnLayout.Right = Right;
ThreeColumnLayout.Handle = ResizableHandle;

export { ThreeColumnLayout };
