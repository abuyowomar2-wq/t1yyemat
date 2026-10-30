"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import type { Merchant } from "@/lib/types";

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface CreateReviewRequestResult extends ActionResult {
  link?: string;
}

// كل action يتحقق من الجلسة وملف البائع بنفسه — ما يعتمد على إن الصفحة
// اللي استدعته كانت محمية أصلًا.
async function requireMerchant(): Promise<Merchant | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (merchant as Merchant) ?? null;
}

async function findOrCreateCustomer(
  merchantId: string,
  fullName: string,
  phoneRaw: string
) {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { customer: null, error: "رقم الجوال غير صالح." };

  const { data: existing } = await supabaseAdmin
    .from("merchant_customers")
    .select("id, full_name, phone")
    .eq("merchant_id", merchantId)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) return { customer: existing, error: null };

  const { data: created, error } = await supabaseAdmin
    .from("merchant_customers")
    .insert({ merchant_id: merchantId, full_name: fullName, phone })
    .select("id, full_name, phone")
    .single();

  if (error || !created) {
    return {
      customer: null,
      error: `صار خطأ أثناء حفظ بيانات العميل: ${error?.message ?? "unknown"}`,
    };
  }

  return { customer: created, error: null };
}

export async function createReviewRequestAction(formData: {
  customerName: string;
  phone: string;
  orderNumber: string;
  productName: string;
}): Promise<CreateReviewRequestResult> {
  const merchant = await requireMerchant();
  if (!merchant) {
    return { success: false, message: "غير مصرح لك." };
  }

  const customerName = formData.customerName.trim();
  const orderNumber = formData.orderNumber.trim();
  const productName = formData.productName.trim();

  if (!customerName || !formData.phone.trim() || !orderNumber || !productName) {
    return { success: false, message: "عبّي كل الحقول." };
  }

  const { customer, error: customerError } = await findOrCreateCustomer(
    merchant.id,
    customerName,
    formData.phone
  );
  if (!customer) {
    return { success: false, message: customerError ?? "صار خطأ." };
  }

  const { data, error } = await supabaseAdmin
    .from("merchant_reviews")
    .insert({
      merchant_id: merchant.id,
      customer_id: customer.id,
      customer_name: customer.full_name,
      order_number: orderNumber,
      product_name: productName,
    })
    .select("token")
    .single();

  if (error || !data) {
    return {
      success: false,
      message: `صار خطأ أثناء إنشاء الطلب: ${error?.message ?? "unknown"}`,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/customers/${customer.id}`);

  return {
    success: true,
    message: "تم إنشاء طلب التقييم.",
    link: `/r/${data.token}`,
  };
}

export async function createReviewRequestForCustomerAction(
  customerId: string,
  formData: { orderNumber: string; productName: string }
): Promise<CreateReviewRequestResult> {
  const merchant = await requireMerchant();
  if (!merchant) {
    return { success: false, message: "غير مصرح لك." };
  }

  const orderNumber = formData.orderNumber.trim();
  const productName = formData.productName.trim();

  if (!orderNumber || !productName) {
    return { success: false, message: "عبّي كل الحقول." };
  }

  const { data: customer } = await supabaseAdmin
    .from("merchant_customers")
    .select("id, full_name")
    .eq("id", customerId)
    .eq("merchant_id", merchant.id)
    .maybeSingle();

  if (!customer) {
    return { success: false, message: "العميل غير موجود." };
  }

  const { data, error } = await supabaseAdmin
    .from("merchant_reviews")
    .insert({
      merchant_id: merchant.id,
      customer_id: customer.id,
      customer_name: customer.full_name,
      order_number: orderNumber,
      product_name: productName,
    })
    .select("token")
    .single();

  if (error || !data) {
    return {
      success: false,
      message: `صار خطأ أثناء إنشاء الطلب: ${error?.message ?? "unknown"}`,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/customers/${customerId}`);

  return {
    success: true,
    message: "تم إنشاء طلب التقييم.",
    link: `/r/${data.token}`,
  };
}

export async function setReviewStatusAction(
  reviewId: string,
  status: "approved" | "rejected"
): Promise<ActionResult> {
  const merchant = await requireMerchant();
  if (!merchant) {
    return { success: false, message: "غير مصرح لك." };
  }

  const { error } = await supabaseAdmin
    .from("merchant_reviews")
    .update({ status })
    .eq("id", reviewId)
    .eq("merchant_id", merchant.id)
    .eq("status", "submitted");

  if (error) {
    return { success: false, message: "صار خطأ أثناء تحديث الحالة." };
  }

  revalidatePath("/dashboard");

  return { success: true, message: "تم التحديث." };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
