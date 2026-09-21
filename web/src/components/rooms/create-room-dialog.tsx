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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import { createRoom } from "@/lib/api/rooms";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a room name").max(80),
  type: z.string().trim().min(2).max(40),
  address: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  currency: z.string().trim().length(3),
  monthlyBudget: z.coerce.number().nonnegative().optional(),
  memberLimit: z.coerce.number().int().min(1).max(50),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function CreateRoomDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "Flat",
      currency: "INR",
      memberLimit: 6,
    },
  });

  async function onSubmit(values: FormOutput) {
    const result = await createRoom({ ...values, timezone: "Asia/Kolkata" });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Room created");
    onOpenChange(false);
    reset();
    onCreated();
    router.push(`/r/${result.data.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a room</DialogTitle>
          <DialogDescription>
            Set the basics now — you can change them anytime from room settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField id="name" label="Room name" error={errors.name?.message}>
            <Input id="name" placeholder="Green Valley PG" {...register("name")} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="type" label="Room type" error={errors.type?.message}>
              <Input id="type" placeholder="Flat, PG, Hostel..." {...register("type")} />
            </FormField>
            <FormField id="currency" label="Currency" error={errors.currency?.message}>
              <Input id="currency" placeholder="INR" maxLength={3} {...register("currency")} />
            </FormField>
          </div>

          <FormField id="address" label="Address (optional)" error={errors.address?.message}>
            <Input id="address" placeholder="City, area" {...register("address")} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="monthlyBudget" label="Monthly budget (optional)" error={errors.monthlyBudget?.message}>
              <Input id="monthlyBudget" type="number" min={0} placeholder="45000" {...register("monthlyBudget")} />
            </FormField>
            <FormField id="memberLimit" label="Member limit" error={errors.memberLimit?.message}>
              <Input id="memberLimit" type="number" min={1} max={50} {...register("memberLimit")} />
            </FormField>
          </div>

          <FormField id="description" label="Description (optional)" error={errors.description?.message}>
            <Textarea id="description" rows={2} placeholder="A short note about your room" {...register("description")} />
          </FormField>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Create room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
