"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ItemDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    title: string;
    description: string;
    details: Record<string, string | string[]>;
  } | null;
  isCode?: boolean;
}

export function ItemDetailsDialog({ isOpen, onClose, item, isCode = false }: ItemDetailsDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{item.title}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {Object.entries(item.details).map(([key, value]) => (
              <div key={key} className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 items-start">
                <span className="font-semibold text-muted-foreground text-sm">{key}:</span>
                {isCode && key.toLowerCase().includes('content') ? (
                   <pre className="text-sm bg-muted text-muted-foreground p-3 rounded-md overflow-x-auto">
                    <code>{Array.isArray(value) ? value.join(", ") : value}</code>
                  </pre>
                ) : (
                  <p className="text-sm leading-relaxed">
                    {Array.isArray(value) ? value.map(v => <Badge key={v} variant="secondary" className="mr-1">{v}</Badge>) : value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
