
"use client";

import React from 'react';
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePanel } from './three-column-layout';

export function CollapsiblePanelHeader({ children }: { children: React.ReactNode }) {
  const { id } = React.useContext(CollapsiblePanelContext);
  const { getPanelState, togglePanel } = usePanel();
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
        <span className="sr-only">{isMaximized ? 'Restore' : 'Maximize'}</span>
      </Button>
    </div>
  );
}

const CollapsiblePanelContext = React.createContext<{ id: string }>({ id: '' });

export function CollapsiblePanel({ children }: { children: React.ReactNode }) {
  const { isAnyPanelMaximized, getPanelState } = usePanel();
  const id = React.useContext(CollapsiblePanelContext).id || '';
  const isThisPanelMaximized = getPanelState(id) === 'collapsed';
  
  if (isAnyPanelMaximized && !isThisPanelMaximized) {
    return null; // Don't render other panels when one is maximized
  }

  return (
    <div className="flex-1 flex flex-col h-full">{children}</div>
  );
}

export const withCollapsibleContext = (Component: React.ComponentType, id: string) => {
    return (props: any) => (
        <CollapsiblePanelContext.Provider value={{ id }}>
            <Component {...props} />
        </CollapsiblePanelContext.Provider>
    )
}
