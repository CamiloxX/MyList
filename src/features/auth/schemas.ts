import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  displayName: z.string().min(1, "Ingresa tu nombre").max(50, "Máximo 50 caracteres"),
});
export type RegisterInput = z.infer<typeof registerSchema>;
