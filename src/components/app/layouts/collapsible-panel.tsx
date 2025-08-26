
"use client";

import React from 'react';
import { Maximize2, Minimize2, PanelTopClose, PanelBottomClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePanel } from './three-column-layout';

// A new context to pass the panel ID down to the header.
const CollapsiblePanelContext = React.createContext<{ id: string }>({ id: '' });

export function CollapsiblePanelHeader({ children }: { children: React.ReactNode }) {
  const { id } = React.useContext(CollapsiblePanelContext);
  const { getPanelState, maximizePanel, minimizePanel, closePanel, openPanel, maximizedPanel } = usePanel();
  
  const panelState = getPanelState(id);
  const isMaximized = maximizedPanel === id;

  if (panelState === 'closed') {
      return (
          <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="flex-1 font-semibold text-muted-foreground truncate pr-2">{children} (已关闭)</div>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openPanel(id)}
                  title="打开面板"
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
            title="关闭面板"
          >
            <PanelTopClose className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </Button>
      </div>
    </div>
  );
}

export function CollapsiblePanel({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { getPanelState } = usePanel();
  const state = getPanelState(id);

  const mainContent = React.Children.toArray(children).filter(child => 
      !React.isValidElement(child) || child.type !== CollapsiblePanelHeader
  );

  return (
    <CollapsiblePanelContext.Provider value={{ id }}>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {React.Children.map(children, (child) => 
                React.isValidElement(child) && child.type === CollapsiblePanelHeader ? child : null
            )}
            {state !== 'closed' && (
                <div className="flex-1 overflow-y-auto">
                    {mainContent}
                </div>
            )}
        </div>
    </CollapsiblePanelContext.Provider>
  );
}
