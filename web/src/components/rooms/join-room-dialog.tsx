"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { joinRoom } from "@/lib/api/rooms";

const schema = z.object({
  code: z.string().trim().min(1, "Enter an invite code or link"),
});
type FormValues = z.infer<typeof schema>;

function extractCode(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/\/invite\/([\w-]+)/);
  return match ? match[1] : trimmed;
}

export function JoinRoomDialog({
  open,
  onOpenChange,
  onJoined,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: () => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { code: "" } });

  async function onSubmit(values: FormValues) {
    const result = await joinRoom(extractCode(values.code));
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("You've joined the room");
    onOpenChange(false);
    reset();
    onJoined();
    router.push(`/r/${result.data.roomId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>
            Paste the invite link or code a roommate shared with you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField id="code" label="Invite link or code" error={errors.code?.message}>
            <Input id="code" placeholder="https://... or code" {...register("code")} />
          </FormField>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Join room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
