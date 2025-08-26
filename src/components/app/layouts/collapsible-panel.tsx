
"use client";

import React from 'react';
import { Maximize2, Minimize2, PanelTopClose, PanelBottomClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePanel } from './three-column-layout';

// A new context to pass the panel ID down to the header.
const CollapsiblePanelContext = React.createContext<{ id: string }>({ id: '' });

export function CollapsiblePanelHeader({ children }: { children: React.ReactNode }) {
  const { id } = React.useContext(CollapsiblePanelContext);
  const { getPanelState, maximizePanel, minimizePanel, closePanel, openPanel } = usePanel();
  
  const panelState = getPanelState(id);
  const isMaximized = panelState === 'collapsed';
  const isClosed = panelState === 'closed';

  if (isClosed) {
      return (
          <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="flex-1 font-semibold text-muted-foreground">{children} (Closed)</div>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openPanel(id)}
                  title="Open panel"
              >
                  <PanelBottomClose className="h-4 w-4" />
                  <span className="sr-only">打开</span>
              </Button>
          </div>
      );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <div className="flex-1 font-semibold truncate pr-2">{children}</div>
      <div className="flex items-center">
         <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => isMaximized ? minimizePanel() : maximizePanel(id)}
            title={isMaximized ? '恢复' : '最大化'}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="sr-only">{isMaximized ? '恢复' : '最大化'}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => closePanel(id)}
            title="Close panel"
          >
            <PanelTopClose className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </Button>
      </div>
    </div>
  );
}

export function CollapsiblePanel({ id, children }: { id: string, children: React.ReactNode }) {
  const { getPanelState } = usePanel();
  
  if (getPanelState(id) === 'closed') {
      return null;
  }

  return (
    <CollapsiblePanelContext.Provider value={{ id }}>
        <div className="flex-1 flex flex-col h-full">{children}</div>
    </CollapsiblePanelContext.Provider>
  );
}
