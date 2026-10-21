import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { signupDisabled } from "@/lib/auth/clerk";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (signupDisabled()) redirect("/sign-in");
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SignUp />
    </div>
  );
}
