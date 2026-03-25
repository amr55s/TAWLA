"use server";

import { cookies } from "next/headers";

export async function setStaffSession(payload: { role: 'owner' | 'admin' | 'cashier' | 'waiter'; restaurant_id: string; slug: string }) {
  const cookieStore = await cookies();
  
  cookieStore.set("tawla_staff_session", JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearStaffSession() {
  const cookieStore = await cookies();
  cookieStore.delete("tawla_staff_session");
}
