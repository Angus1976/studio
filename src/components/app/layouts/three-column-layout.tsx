
"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";

// --- Context for Panel Controls ---
type PanelContextType = {
  getPanelState: (id: string) => "collapsed" | "expanded";
  togglePanel: (id: string) => void;
  isAnyPanelMaximized: boolean;
};

const PanelContext = createContext<PanelContextType | null>(null);

export function usePanel() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error("usePanel must be used within a ThreeColumnLayout");
  }
  return context;
}

// --- Layout Component ---
const ThreeColumnLayout = ({
  children,
  className,
  autoSaveId,
}: {
  children: React.ReactNode;
  className?: string;
  autoSaveId: string;
}) => {
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const [panelState, setPanelState] = useState<Record<string, "collapsed" | "expanded">>({});
  const [isAnyPanelMaximized, setIsAnyPanelMaximized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const lastLayoutRef = useRef<number[] | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onLayout = (sizes: number[]) => {
    if (isMounted && !isAnyPanelMaximized) {
        lastLayoutRef.current = sizes;
        document.cookie = `react-resizable-panels:${autoSaveId}=${JSON.stringify(sizes)}; max-age=31536000; path=/`;
    }
  };

  const getPanelState = (id: string) => panelState[id] || "expanded";

  const togglePanel = (id: string) => {
    const group = panelGroupRef.current;
    if (!group) return;

    const currentState = getPanelState(id);
    if (currentState === "expanded") {
        const panelIds = React.Children.map(children, child => {
            if (React.isValidElement(child) && (child.type === Left || child.type === Main || child.type === Right)) {
                return child.props.id;
            }
            return null;
        }).filter(Boolean);

        if (!lastLayoutRef.current) {
            lastLayoutRef.current = group.getLayout();
        }

        const newLayout = panelIds.map(panelId => (panelId === id ? 100 : 0));
        group.setLayout(newLayout);
        
        setPanelState({ [id]: "collapsed" });
        setIsAnyPanelMaximized(true);

    } else { // "collapsed"
        if(lastLayoutRef.current) {
            group.setLayout(lastLayoutRef.current);
        } else {
             // Fallback if no last layout is stored
            const panelCount = React.Children.count(children) / 2 + 0.5; // accounts for handles
            const defaultLayout = Array(panelCount).fill(100/panelCount);
            group.setLayout(defaultLayout);
        }
        setPanelState({});
        setIsAnyPanelMaximized(false);
    }
  };
  
  const contextValue: PanelContextType = {
    getPanelState,
    togglePanel,
    isAnyPanelMaximized,
  };


  return (
    <PanelContext.Provider value={contextValue}>
        <ResizablePanelGroup
        ref={panelGroupRef}
        direction="horizontal"
        className={cn("h-full max-h-full items-stretch", className)}
        autoSaveId={autoSaveId}
        onLayout={onLayout}
        >
        {children}
        </ResizablePanelGroup>
    </PanelContext.Provider>
  );
};

const PanelComponent = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePanel>) => {
  return (
    <ResizablePanel
      className={cn(
        "h-full flex flex-col !overflow-y-auto",
        className
      )}
      {...props}
    >
      <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </ResizablePanel>
  );
};


const Left = PanelComponent;
const Main = PanelComponent;
const Right = PanelComponent;


ThreeColumnLayout.Left = Left;
ThreeColumnLayout.Main = Main;
ThreeColumnLayout.Right = Right;
ThreeColumnLayout.Handle = ResizableHandle;

export { ThreeColumnLayout };
