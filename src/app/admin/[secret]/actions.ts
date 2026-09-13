"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidAdminSecret } from "@/lib/adminAuth";

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface CreateReviewRequestResult extends ActionResult {
  link?: string;
}

export async function createReviewRequestAction(
  secret: string,
  formData: { customerName: string; orderNumber: string; productName: string }
): Promise<CreateReviewRequestResult> {
  if (!isValidAdminSecret(secret)) {
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

  revalidatePath(`/admin/${secret}`);

  return {
    success: true,
    message: "تم إنشاء طلب التقييم.",
    link: `/review/${data.token}`,
  };
}

export async function setReviewStatusAction(
  secret: string,
  reviewId: string,
  status: "approved" | "rejected"
): Promise<ActionResult> {
  if (!isValidAdminSecret(secret)) {
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

  revalidatePath(`/admin/${secret}`);

  return { success: true, message: "تم التحديث." };
}
