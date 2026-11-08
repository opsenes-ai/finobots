"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a verification code to your email address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter the 6-digit code"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Verify
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            className="font-medium text-foreground hover:underline"
          >
            Resend
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}
