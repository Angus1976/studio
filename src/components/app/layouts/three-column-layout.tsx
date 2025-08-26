
"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import React from "react";
import type { ImperativePanelGroupHandle, PanelOnResize } from "react-resizable-panels";

// --- Context for Panel Controls ---
type PanelContextType = {
  getPanelState: (id: string) => "collapsed" | "expanded" | "closed";
  maximizePanel: (id: string) => void;
  minimizePanel: () => void;
  closePanel: (id: string) => void;
  openPanel: (id: string) => void;
  maximizedPanel: string | null;
  closedPanels: string[];
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
  const [maximizedPanel, setMaximizedPanel] = React.useState<string | null>(null);
  const [closedPanels, setClosedPanels] = React.useState<string[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const lastLayoutRef = React.useRef<number[] | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const onLayout: PanelOnResize = (sizes) => {
    if (isMounted && !maximizedPanel) {
        lastLayoutRef.current = sizes;
        document.cookie = `react-resizable-panels:${autoSaveId}=${JSON.stringify(sizes)}; max-age=31536000; path=/`;
    }
  };

  const getPanelState = (id: string) => {
    if (closedPanels.includes(id)) return "closed";
    if (maximizedPanel === id) return "collapsed"; // 'collapsed' here means it's maximized for the toggle logic
    return "expanded";
  };

  const maximizePanel = (id: string) => {
    const group = panelGroupRef.current;
    if (!group) return;

    if (!lastLayoutRef.current) {
      lastLayoutRef.current = group.getLayout();
    }
    
    const panelIds = React.Children.map(children, child => {
        if (React.isValidElement(child) && (child.type === Left || child.type === Main || child.type === Right)) {
            return child.props.id;
        }
        return null;
    }).filter(Boolean);

    const newLayout = panelIds.map(panelId => (panelId === id ? 100 : 0));
    
    if (newLayout.length === group.getLayout().length) {
        group.setLayout(newLayout);
    } else {
        console.error("Mismatch between calculated layout and actual panel count.");
        return;
    }
    
    setMaximizedPanel(id);
  };
  
  const minimizePanel = () => {
    const group = panelGroupRef.current;
    if (!group) return;

    let layoutToRestore = lastLayoutRef.current;
     if (!layoutToRestore || layoutToRestore.length !== group.getLayout().length) {
        const panelCount = React.Children.toArray(children).filter(child => 
            React.isValidElement(child) && child.type !== ResizableHandle
        ).length;
        
        if (panelCount > 0) {
           const defaultSize = 100 / panelCount;
           layoutToRestore = Array(panelCount).fill(defaultSize);
        } else {
            layoutToRestore = [25, 45, 30]; // Default fallback
        }
    }

    group.setLayout(layoutToRestore);
    setMaximizedPanel(null);
  };

  const closePanel = (id: string) => {
    const group = panelGroupRef.current;
    if (!group) return;
    group.getPanel(id)?.collapse();
    setClosedPanels(prev => [...prev, id]);
  };

  const openPanel = (id: string) => {
      const group = panelGroupRef.current;
      if (!group) return;
      group.getPanel(id)?.expand();
      setClosedPanels(prev => prev.filter(pId => pId !== id));
  };
  
  const contextValue: PanelContextType = {
    getPanelState,
    maximizePanel,
    minimizePanel,
    closePanel,
    openPanel,
    maximizedPanel,
    closedPanels,
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
    const { maximizedPanel, closedPanels } = usePanel();
    const isThisMaximized = maximizedPanel === id;

    if ((maximizedPanel && !isThisMaximized) || closedPanels.includes(id)) {
        return null;
    }
    
  return (
    <ResizablePanel
      id={id}
      className={cn(
        "h-full flex flex-col !overflow-y-auto bg-card rounded-lg border",
        className
      )}
      collapsible
      {...props}
    >
      <div className="flex-1 flex flex-col h-full">
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
