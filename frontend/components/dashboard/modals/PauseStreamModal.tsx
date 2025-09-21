"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pause, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Stream {
  id: string;
  description: string;
  recipient: string;
  recipientName?: string;
}

interface PauseStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: Stream | null;
  onSuccess?: () => void;
}

export function PauseStreamModal({ isOpen, onClose, stream, onSuccess }: PauseStreamModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!stream) return null;

  const handlePause = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Stream paused successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to pause stream");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5 text-yellow-500" />
            Pause Stream
          </DialogTitle>
          <DialogDescription>
            Temporarily pause this payment stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Stream will be paused</p>
              <p>Payments will stop flowing until you resume the stream. You can resume it at any time.</p>
            </div>
          </div>

          {/* Stream Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium">{stream.description}</p>
            <p className="text-sm text-muted-foreground">
              To: {stream.recipientName || `${stream.recipient.slice(0, 8)}...${stream.recipient.slice(-8)}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handlePause} 
              disabled={isLoading}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pausing...
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Stream
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}