// app/page.tsx
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to Field Sales
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage visits, orders, inventory and teams efficiently.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignInButton mode="modal">
            <Button size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </SignInButton>

          <SignUpButton mode="modal">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Sign Up
            </Button>
          </SignUpButton>
        </div>

        <p className="text-sm text-muted-foreground">
          Already have an account? <Link href="/sign-in" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}