"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Bitcoin, 
  Clock, 
  Info,
  Wallet,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const createStreamSchema = z.object({
  recipient: z.string().min(1, "Recipient address is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  duration: z.string().min(1, "Duration is required"),
  durationType: z.enum(["blocks", "days", "weeks", "months"]),
  description: z.string().optional(),
  startImmediately: z.boolean().default(true),
  startDate: z.string().optional(),
});

type CreateStreamForm = z.infer<typeof createStreamSchema>;

export default function CreateStreamPage() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(createStreamSchema),
    defaultValues: {
      recipient: "",
      amount: "",
      duration: "",
      durationType: "days" as const,
      description: "",
      startImmediately: true,
    },
  });

  const watchedValues = form.watch();

  // Calculate estimated values
  const calculateEstimates = () => {
    const amount = parseFloat(watchedValues.amount || "0");
    const duration = parseInt(watchedValues.duration || "0");
    
    if (!amount || !duration) return null;

    let durationInSeconds = 0;
    switch (watchedValues.durationType) {
      case "blocks":
        durationInSeconds = duration * 600; // 10 minutes per block
        break;
      case "days":
        durationInSeconds = duration * 24 * 60 * 60;
        break;
      case "weeks":
        durationInSeconds = duration * 7 * 24 * 60 * 60;
        break;
      case "months":
        durationInSeconds = duration * 30 * 24 * 60 * 60;
        break;
    }

    const perSecond = amount / durationInSeconds;
    const perMinute = perSecond * 60;
    const perHour = perSecond * 3600;
    const perDay = perSecond * 86400;

    return {
      perSecond: perSecond.toFixed(8),
      perMinute: perMinute.toFixed(8),
      perHour: perHour.toFixed(6),
      perDay: perDay.toFixed(4),
      totalDuration: durationInSeconds,
    };
  };

  const estimates = calculateEstimates();

  const onSubmit = async (data: CreateStreamForm) => {
    setIsCreating(true);
    
    try {
      // TODO: Integrate with smart contract
      console.log("Creating stream:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Stream created successfully!");
      router.push("/dashboard/streams");
    } catch (error) {
      toast.error("Failed to create stream. Please try again.");
      console.error("Stream creation error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const validateAddress = (address: string) => {
    // Basic Stacks address validation
    return address.startsWith("SP") || address.startsWith("ST");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/streams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Stream</h1>
          <p className="text-muted-foreground">Set up a continuous Bitcoin payment stream</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Stream Details</CardTitle>
              <CardDescription>
                Configure your Bitcoin stream parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Recipient */}
                  <FormField
                    control={form.control}
                    name="recipient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Recipient Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SP1J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7"
                            {...field}
                            className={
                              field.value && !validateAddress(field.value)
                                ? "border-red-500"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a valid Stacks address (starts with SP or ST)
                        </FormDescription>
                        <FormMessage />
                        
                        {field.value && !validateAddress(field.value) && (
                          <div className="flex items-center gap-2 text-red-500 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            Invalid Stacks address format
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Amount */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Bitcoin className="h-4 w-4" />
                          Total Amount (sBTC)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.00000001"
                            min="0"
                            placeholder="1.00000000"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Total amount to stream over the specified duration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Duration
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blocks">Blocks</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="weeks">Weeks</SelectItem>
                              <SelectItem value="months">Months</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Monthly salary, Project payment, Consulting fees..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add a description to help identify this stream
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Submit */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating || !form.formState.isValid}
                      className="bg-brand-pink hover:bg-brand-pink/90 text-white"
                    >
                      {isCreating ? "Creating Stream..." : "Create Stream"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          {/* Stream Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {estimates ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <span className="font-medium">{watchedValues.amount || "0"} sBTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {watchedValues.duration || "0"} {watchedValues.durationType}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Streaming Rate</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per second</span>
                        <span className="text-brand-pink font-mono">{estimates.perSecond} sBTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per minute</span>
                        <span className="text-brand-teal font-mono">{estimates.perMinute} sBTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per hour</span>
                        <span className="text-brand-pink font-mono">{estimates.perHour} sBTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per day</span>
                        <span className="text-brand-teal font-mono">{estimates.perDay} sBTC</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bitcoin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Enter amount and duration to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-600" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                <li>• Streams cannot be modified once created</li>
                <li>• Recipients can withdraw vested amounts anytime</li>
                <li>• You can cancel streams but vested amounts remain claimable</li>
                <li>• Ensure you have sufficient sBTC balance</li>
                <li>• Network fees apply for stream creation</li>
              </ul>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  form.setValue("amount", "2.5");
                  form.setValue("duration", "30");
                  form.setValue("durationType", "days");
                  form.setValue("description", "Monthly salary payment");
                }}
              >
                💼 Monthly Salary
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  form.setValue("amount", "1.0");
                  form.setValue("duration", "7");
                  form.setValue("durationType", "days");
                  form.setValue("description", "Weekly project payment");
                }}
              >
                📋 Weekly Project
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  form.setValue("amount", "0.5");
                  form.setValue("duration", "1000");
                  form.setValue("durationType", "blocks");
                  form.setValue("description", "Short-term payment");
                }}
              >
                ⚡ Quick Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}