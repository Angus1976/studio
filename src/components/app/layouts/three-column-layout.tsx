
"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import React from "react";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";

// --- Context for Panel Controls ---
type PanelContextType = {
  getPanelState: (id: string) => "expanded" | "closed";
  maximizePanel: (id: string) => void;
  minimizePanel: () => void;
  closePanel: (id: string) => void;
  openPanel: (id: string) => void;
  maximizedPanel: string | null;
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

  const onLayout = (sizes: number[]) => {
    if (isMounted && !maximizedPanel) {
        lastLayoutRef.current = sizes;
        document.cookie = `react-resizable-panels:${autoSaveId}=${JSON.stringify(sizes)}; path=/; max-age=31536000; path=/`;
    }
  };

  const getPanelState = React.useCallback((id: string): "expanded" | "closed" => {
    return closedPanels.includes(id) ? "closed" : "expanded";
  }, [closedPanels]);
  
  const maximizePanel = React.useCallback((id: string) => {
    const group = panelGroupRef.current;
    if (!group) return;

    if (!maximizedPanel) {
        lastLayoutRef.current = group.getLayout();
    }
    
    const panelIds = getPanelIds();
    const newLayout = panelIds.map(panelId => (panelId === id ? 100 : 0));
    
    if (newLayout.length === group.getLayout().length) {
        group.setLayout(newLayout);
    } else {
        console.error("Layout mismatch: Cannot maximize panel.");
        return;
    }
    
    setMaximizedPanel(id);
  }, [getPanelIds, maximizedPanel]);
  
  const minimizePanel = React.useCallback(() => {
    const group = panelGroupRef.current;
    if (!group) return;

    const panelIds = getPanelIds();
    let layoutToRestore = lastLayoutRef.current;
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
    } else if (totalSize === 0) { 
        const defaultSize = 100 / panelCount;
        finalLayout.fill(defaultSize);
    }

    group.setLayout(finalLayout);
    setMaximizedPanel(null);
  }, [closedPanels, getPanelIds]);

  const closePanel = React.useCallback((id: string) => {
    const group = panelGroupRef.current;
    if (!group) return;
    
    const panelIds = getPanelIds();
    const panelIndex = panelIds.indexOf(id);
    if (panelIndex === -1) return;

    const currentLayout = group.getLayout();
    if (currentLayout[panelIndex] === 0) return;

    if (!maximizedPanel) {
        lastLayoutRef.current = currentLayout;
    }
    
    const sizeToDistribute = currentLayout[panelIndex];
    const newLayout = [...currentLayout];
    newLayout[panelIndex] = 0;
    
    const openPanelsCount = newLayout.filter(size => size > 0).length;
    if(openPanelsCount > 0) {
        const spacePerPanel = sizeToDistribute / openPanelsCount;
        for(let i=0; i<newLayout.length; i++) {
            if(newLayout[i] > 0) {
                 newLayout[i] += spacePerPanel;
            }
        }
    } else if (maximizedPanel) {
        // If we close the maximized panel, restore the previous layout
        minimizePanel();
    }
    
    group.setLayout(newLayout);
    setClosedPanels(prev => [...new Set([...prev, id])]);
    if(maximizedPanel === id) {
        setMaximizedPanel(null);
    }
  }, [getPanelIds, maximizedPanel, minimizePanel]);

  const openPanel = React.useCallback((id: string) => {
      const group = panelGroupRef.current;
      if (!group) return;

      const panelIds = getPanelIds();
      const panelIndex = panelIds.indexOf(id);
      if(panelIndex === -1) return;

      const currentLayout = group.getLayout();
      if(currentLayout[panelIndex] > 0) return;

      const layoutToRestore = lastLayoutRef.current || Array(panelIds.length).fill(100/panelIds.length);
      
      const sizeToRestore = layoutToRestore[panelIndex] || 25; 
      const newLayout = [...currentLayout];
      newLayout[panelIndex] = sizeToRestore;

      const otherOpenPanelsTotalSize = newLayout.reduce((acc, size, i) => (i !== panelIndex && size > 0 ? acc + size : acc), 0);
      
      if(otherOpenPanelsTotalSize > 0) {
        const factor = (100 - sizeToRestore) / otherOpenPanelsTotalSize;
        for (let i=0; i < newLayout.length; i++) {
            if (i !== panelIndex && newLayout[i] > 0) {
                newLayout[i] *= factor;
            }
        }
      }

      group.setLayout(newLayout);
      setClosedPanels(prev => prev.filter(pId => pId !== id));
  }, [getPanelIds]);
  
  const contextValue = React.useMemo(() => ({
    getPanelState,
    maximizePanel,
    minimizePanel,
    closePanel,
    openPanel,
    maximizedPanel,
  }), [getPanelState, maximizePanel, minimizePanel, closePanel, openPanel, maximizedPanel]);

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
        "h-full flex flex-col bg-card rounded-lg border",
        className,
        state === 'closed' && 'hidden'
      )}
      collapsible
      collapsedSize={0}
      {...props}
    >
      {children}
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
