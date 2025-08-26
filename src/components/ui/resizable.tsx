
"use client"

import { PanelGroup as PanelGroupPrimitive, Panel as ResizablePanelPrimitive, PanelResizeHandle as ResizableHandlePrimitive } from "react-resizable-panels"
import { ImperativePanelGroupHandle, PanelGroupOnLayout } from "react-resizable-panels"
import { cn } from "@/lib/utils"
import * as React from "react"
import { usePathname } from 'next/navigation'


const ResizablePanelGroup = React.forwardRef<ImperativePanelGroupHandle, React.ComponentProps<typeof PanelGroupPrimitive> & {autoSaveId: string}>(({className, autoSaveId, ...props}, ref) => {
    const pathname = usePathname()
    const [isMounted, setIsMounted] = React.useState(false);

    // This is a workaround to prevent the layout from being saved on the server,
    // which would cause a mismatch between the server and client.
    // See: https://github.com/bvaughn/react-resizable-panels/issues/234
    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const onLayout = (sizes: number[]) => {
        if(isMounted) {
            document.cookie = `resizable-panels:${autoSaveId}:${pathname}=${JSON.stringify(sizes)}; max-age=31536000; path=/`;
        }
        (props.onLayout as PanelGroupOnLayout)?.(sizes)
    }

    return (
        <PanelGroupPrimitive
            ref={ref}
            className={cn(
                "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
                className
            )}
            onLayout={isMounted ? onLayout : undefined}
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
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:rotate-90 data-[resize-handle-state=drag]:bg-ring data-[resize-handle-state=hover]:bg-ring/50",
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
