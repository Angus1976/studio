
"use client";

import React from 'react';
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePanel } from './three-column-layout';

// A new context to pass the panel ID down to the header.
const CollapsiblePanelContext = React.createContext<{ id: string }>({ id: '' });

export function CollapsiblePanelHeader({ children }: { children: React.ReactNode }) {
  // Use the context to get the panel's ID.
  const { id } = React.useContext(CollapsiblePanelContext);
  const { getPanelState, togglePanel } = usePanel();
  
  // Determine if the current panel is the one that's maximized.
  // The state 'collapsed' in the layout context means this panel is maximized.
  const isMaximized = getPanelState(id) === 'collapsed';

  return (
    <div className="flex items-center justify-between p-4 md:p-6 md:pb-2 lg:p-8 lg:pb-4 border-b mb-4">
      <div className="flex-1">{children}</div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => togglePanel(id)}
      >
        {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        <span className="sr-only">{isMaximized ? '恢复' : '最大化'}</span>
      </Button>
    </div>
  );
}

export function CollapsiblePanel({ id, children }: { id: string, children: React.ReactNode }) {
  const { isAnyPanelMaximized, getPanelState } = usePanel();
  const isThisPanelMaximized = getPanelState(id) === 'collapsed';
  
  // If any panel is maximized, but it's not this one, don't render this panel at all.
  if (isAnyPanelMaximized && !isThisPanelMaximized) {
    return null;
  }

  return (
    <CollapsiblePanelContext.Provider value={{ id }}>
        <div className="flex-1 flex flex-col h-full">{children}</div>
    </CollapsiblePanelContext.Provider>
  );
}
