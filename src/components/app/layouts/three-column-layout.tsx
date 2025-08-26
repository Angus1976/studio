
"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import React, from "react";
import type { ImperativePanelGroupHandle, PanelOnResize } from "react-resizable-panels";

// --- Context for Panel Controls ---
type PanelContextType = {
  getPanelState: (id: string) => "collapsed" | "expanded";
  togglePanel: (id: string) => void;
  isAnyPanelMaximized: boolean;
};

const PanelContext = React.createContext<PanelContextType | null>(null);

export function usePanel() {
  const context = React.useContext(PanelContext);
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
  const panelGroupRef = React.useRef<ImperativePanelGroupHandle>(null);
  const [panelState, setPanelState] = React.useState<Record<string, "collapsed" | "expanded">>({});
  const [isAnyPanelMaximized, setIsAnyPanelMaximized] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const lastLayoutRef = React.useRef<number[] | null>(null);

  React.useEffect(() => {
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
        // Filter out handles and only get panel IDs
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
        
        // Ensure the layout has the correct number of panels
        if (newLayout.length === group.getLayout().length) {
            group.setLayout(newLayout);
        } else {
            console.error("Mismatch between calculated layout and actual panel count.");
            // Fallback or error handling
            return;
        }
        
        setPanelState({ [id]: "collapsed" });
        setIsAnyPanelMaximized(true);

    } else { // "collapsed"
        let layoutToRestore = lastLayoutRef.current;
        
        // Fallback if last layout is not available or invalid
        if (!layoutToRestore || layoutToRestore.length !== group.getLayout().length) {
            const panelCount = React.Children.toArray(children).filter(child => 
                React.isValidElement(child) && child.type !== ResizableHandle
            ).length;
            
            if(panelCount > 0) {
               const defaultSize = 100 / panelCount;
               layoutToRestore = Array(panelCount).fill(defaultSize);
            } else {
                layoutToRestore = [33, 34, 33]; // Default fallback
            }
        }

        group.setLayout(layoutToRestore);
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

// Define a type for ResizablePanel props including `id`
type PanelComponentProps = React.ComponentProps<typeof ResizablePanel> & { id: string };

const PanelComponent: React.FC<PanelComponentProps> = ({
  children,
  className,
  id,
  ...props
}) => {
    const { getPanelState, isAnyPanelMaximized } = usePanel();
    const isThisMaximized = getPanelState(id) === 'collapsed';

    if(isAnyPanelMaximized && !isThisMaximized) {
        return null;
    }
    
  return (
    <ResizablePanel
      id={id}
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
