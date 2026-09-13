"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/adminAllowlist";

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface CreateReviewRequestResult extends ActionResult {
  link?: string;
}

// Every action re-checks the session itself — never trust that middleware
// alone guarded the page this action was called from.
async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdminEmail(user.email)) {
    return null;
  }

  return user;
}

export async function createReviewRequestAction(formData: {
  customerName: string;
  orderNumber: string;
  productName: string;
}): Promise<CreateReviewRequestResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, message: "غير مصرح لك." };
  }

  const customerName = formData.customerName.trim();
  const orderNumber = formData.orderNumber.trim();
  const productName = formData.productName.trim();

  if (!customerName || !orderNumber || !productName) {
    return { success: false, message: "عبّي كل الحقول." };
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      customer_name: customerName,
      order_number: orderNumber,
      product_name: productName,
    })
    .select("token")
    .single();

  if (error || !data) {
    return { success: false, message: "صار خطأ أثناء إنشاء الطلب." };
  }

  revalidatePath("/admin");

  return {
    success: true,
    message: "تم إنشاء طلب التقييم.",
    link: `/review/${data.token}`,
  };
}

export async function setReviewStatusAction(
  reviewId: string,
  status: "approved" | "rejected"
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, message: "غير مصرح لك." };
  }

  const { error } = await supabaseAdmin
    .from("reviews")
    .update({ status })
    .eq("id", reviewId)
    .eq("status", "submitted");

  if (error) {
    return { success: false, message: "صار خطأ أثناء تحديث الحالة." };
  }

  revalidatePath("/admin");

  return { success: true, message: "تم التحديث." };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
