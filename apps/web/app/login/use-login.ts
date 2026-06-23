import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, LoginSchema } from "./schema";

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginSchema) => {
      const success = await login(data.email, data.password);
      if (!success) {
        throw new Error("Invalid credentials or Manage service error");
      }
      return success;
    },
    onSuccess: () => {
      toast.success("Signed in successfully!");
      router.push("/dashboard");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to sign in");
    },
  });

  const onSubmit = (data: LoginSchema) => {
    mutation.mutate(data);
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isPending: mutation.isPending,
  };
}
