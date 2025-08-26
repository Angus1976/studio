
"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import React from "react";
import type { ImperativePanelGroupHandle, PanelOnResize } from "react-resizable-panels";
import { CollapsiblePanelHeader } from "./collapsible-panel";

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

  const getPanelIds = React.useCallback(() => {
    return React.Children.map(children, child => {
        if (React.isValidElement(child) && (child.type === Left || child.type === Main || child.type === Right)) {
            return child.props.id as string;
        }
        return null;
    }).filter((id): id is string => id !== null);
  }, [children]);


  const onLayout: PanelOnResize = (sizes) => {
    if (isMounted && !maximizedPanel) {
        lastLayoutRef.current = sizes;
        document.cookie = `react-resizable-panels:${autoSaveId}=${JSON.stringify(sizes)}; max-age=31536000; path=/`;
    }
  };

  const getPanelState = (id: string) => {
    if (closedPanels.includes(id)) return "closed";
    if (maximizedPanel === id) return "expanded";
    return "expanded";
  };

  const maximizePanel = (id: string) => {
    const group = panelGroupRef.current;
    if (!group) return;

    const currentLayout = group.getLayout();
    if (!maximizedPanel) {
        lastLayoutRef.current = currentLayout;
    }
    
    const panelIds = getPanelIds();
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
    const panelIds = getPanelIds();
    const panelCount = panelIds.length;

     if (!layoutToRestore || layoutToRestore.length !== panelCount) {
        const defaultSize = 100 / panelCount;
        layoutToRestore = Array(panelCount).fill(defaultSize);
     }
    
    const finalLayout = layoutToRestore.map((size, index) => {
        return closedPanels.includes(panelIds[index]) ? 0 : size;
    });
    
    const totalSize = finalLayout.reduce((acc, size) => acc + size, 0);
    if (totalSize > 0 && totalSize !== 100) {
        const factor = 100 / totalSize;
        finalLayout.forEach((_, i) => finalLayout[i] *= factor);
    }

    group.setLayout(finalLayout);
    setMaximizedPanel(null);
  };

  const closePanel = (id: string) => {
    const group = panelGroupRef.current;
    if (!group) return;
    
    const panelIds = getPanelIds();
    const panelIndex = panelIds.indexOf(id);
    if (panelIndex === -1) return;

    if (!maximizedPanel) {
        lastLayoutRef.current = group.getLayout();
    }
    const currentLayout = group.getLayout();
    
    const sizeToDistribute = currentLayout[panelIndex];
    if (sizeToDistribute === 0) return; // already closed

    const newLayout = [...currentLayout];
    newLayout[panelIndex] = 0;
    
    const openPanels = newLayout.filter((size, i) => i !== panelIndex && size > 0);
    if(openPanels.length > 0) {
        const spacePerPanel = sizeToDistribute / openPanels.length;
        for(let i=0; i<newLayout.length; i++) {
            if(i !== panelIndex && newLayout[i] > 0) {
                 newLayout[i] += spacePerPanel;
            }
        }
    }
    
    group.setLayout(newLayout);
    setClosedPanels(prev => [...new Set([...prev, id])]);
  };

  const openPanel = (id: string) => {
      const group = panelGroupRef.current;
      if (!group) return;

      const panelIds = getPanelIds();
      const panelIndex = panelIds.indexOf(id);
      if(panelIndex === -1) return;

      const currentLayout = group.getLayout();
      if(currentLayout[panelIndex] > 0) return; // already open

      const layoutToRestore = lastLayoutRef.current || Array(panelIds.length).fill(100/panelIds.length);
      
      const sizeToRestore = layoutToRestore[panelIndex] || 25; // Restore to previous size or a default
      currentLayout[panelIndex] = sizeToRestore;

      // Normalize the rest by taking space from other open panels
      const otherOpenPanelsTotalSize = currentLayout.reduce((acc, size, i) => (i !== panelIndex && size > 0 ? acc + size : acc), 0);
      if(otherOpenPanelsTotalSize > 0) {
        const factor = (100 - sizeToRestore) / otherOpenPanelsTotalSize;
        for (let i=0; i < currentLayout.length; i++) {
            if (i !== panelIndex && currentLayout[i] > 0) {
                currentLayout[i] *= factor;
            }
        }
      }

      group.setLayout(currentLayout);
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

  const visibleChildren = React.Children.toArray(children).filter(child => {
      if (!React.isValidElement(child)) return true;
      if (!maximizedPanel) return true;
      if (child.type === Left || child.type === Main || child.type === Right) {
          return child.props.id === maximizedPanel;
      }
      return true; // Always show handles
  });


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
    const { getPanelState } = usePanel();
    const state = getPanelState(id);
    
  return (
    <ResizablePanel
      id={id}
      className={cn(
        "h-full flex flex-col !overflow-y-auto bg-card rounded-lg border",
        className
      )}
      collapsible
      collapsedSize={0}
      {...props}
    >
      <div className="flex-1 flex flex-col h-full">
        {state !== 'closed' ? children : (
            <div className="flex-1 flex flex-col h-full">
                {React.Children.map(children, child =>
                    React.isValidElement(child) && child.type === CollapsiblePanelHeader ? child : null
                )}
            </div>
        )}
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

