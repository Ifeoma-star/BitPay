"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Stream {
  id: string;
  description: string;
  recipient: string;
  recipientName?: string;
  totalAmount: string;
  vestedAmount: string;
}

interface CancelStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: Stream | null;
  onSuccess?: () => void;
}

export function CancelStreamModal({ isOpen, onClose, stream, onSuccess }: CancelStreamModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [understood, setUnderstood] = useState(false);

  if (!stream) return null;

  const remainingAmount = parseFloat(stream.totalAmount) - parseFloat(stream.vestedAmount);
  const isConfirmValid = confirmText.toLowerCase() === "cancel stream" && understood;

  const handleCancel = async () => {
    if (!isConfirmValid) {
      toast.error("Please confirm by typing 'cancel stream' and checking the box");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Stream cancelled successfully");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      toast.error("Failed to cancel stream");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setConfirmText("");
    setUnderstood(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-500" />
            Cancel Stream
          </DialogTitle>
          <DialogDescription>
            Permanently cancel this payment stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Danger Warning */}
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium mb-1">⚠️ This action cannot be undone</p>
              <p>The stream will be permanently cancelled and cannot be resumed. Remaining funds will be returned to your wallet.</p>
            </div>
          </div>

          {/* Stream Info */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="font-medium">{stream.description}</p>
            <p className="text-sm text-muted-foreground">
              To: {stream.recipientName || `${stream.recipient.slice(0, 8)}...${stream.recipient.slice(-8)}`}
            </p>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">{stream.totalAmount} sBTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Vested:</span>
                <span className="font-semibold text-brand-pink">{stream.vestedAmount} sBTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Will be Returned:</span>
                <span className="font-semibold text-brand-teal">{remainingAmount.toFixed(8)} sBTC</span>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="confirm">Type "cancel stream" to confirm:</Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="cancel stream"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="understood" className="text-sm">
                I understand this action cannot be undone
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Keep Stream
            </Button>
            <Button 
              onClick={handleCancel} 
              disabled={!isConfirmValid || isLoading}
              variant="destructive"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Stream
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}