
"use client"

import { PanelGroup as PanelGroupPrimitive, Panel as ResizablePanelPrimitive, PanelResizeHandle as ResizableHandlePrimitive } from "react-resizable-panels"
import { ImperativePanelGroupHandle, PanelGroupOnLayout, PanelOnCollapse, PanelOnExpand, PanelOnResize } from "react-resizable-panels"

import { cn } from "@/lib/utils"
import * as React from "react"


const ResizablePanelGroup = React.forwardRef<ImperativePanelGroupHandle, React.ComponentProps<typeof PanelGroupPrimitive> & {autoSaveId: string}>(({className, autoSaveId, ...props}, ref) => {
    const [isMounted, setIsMounted] = React.useState(false);
    const onLayout = (sizes: number[]) => {
        if(isMounted) {
            document.cookie = `resizable-panels:${autoSaveId}=${JSON.stringify(sizes)}; max-age=31536000; path=/`;
        }
        (props.onLayout as PanelGroupOnLayout)?.(sizes)
    }

    React.useEffect(() => {
        setIsMounted(true);
    }, [])

    return (
        <PanelGroupPrimitive
            ref={ref}
            className={cn(
                "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
                className
            )}
            onLayout={onLayout}
            {...props}
        />
    )
});
ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof ResizablePanelPrimitive>>(({...props}, ref) => {
    return (
        <ResizablePanelPrimitive ref={ref} {...props} />
    )
})
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizableHandlePrimitive> & {
  withHandle?: boolean
}) => (
  <ResizableHandlePrimitive
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <div className="h-1 w-1 rounded-full bg-gray-500" />
      </div>
    )}
  </ResizableHandlePrimitive>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
