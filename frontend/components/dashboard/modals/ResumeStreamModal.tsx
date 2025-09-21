"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Stream {
  id: string;
  description: string;
  recipient: string;
  recipientName?: string;
}

interface ResumeStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: Stream | null;
  onSuccess?: () => void;
}

export function ResumeStreamModal({ isOpen, onClose, stream, onSuccess }: ResumeStreamModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!stream) return null;

  const handleResume = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Stream resumed successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to resume stream");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-brand-teal" />
            Resume Stream
          </DialogTitle>
          <DialogDescription>
            Resume this paused payment stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-brand-teal/10 rounded-lg border border-brand-teal/20">
            <CheckCircle className="h-4 w-4 text-brand-teal mt-0.5 flex-shrink-0" />
            <div className="text-sm text-brand-teal">
              <p className="font-medium mb-1">Stream will resume</p>
              <p>Payments will continue flowing according to the original schedule.</p>
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
              onClick={handleResume} 
              disabled={isLoading}
              className="flex-1 bg-brand-teal hover:bg-brand-teal/90 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resuming...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Stream
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}