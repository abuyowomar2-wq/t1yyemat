"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/adminAllowlist";
import { normalizePhone } from "@/lib/phone";

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

// يرجّع العميل الموجود بنفس الجوال، أو يسوي واحد جديد لو أول مرة.
// الاسم يبقى ملك أول تسجيل — طلب جديد بنفس الجوال ما يغيّر الاسم
// المحفوظ، حتى لو انكتب مختلف شوي بالمرة الثانية.
async function findOrCreateCustomer(fullName: string, phoneRaw: string) {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { customer: null, error: "رقم الجوال غير صالح." };

  const { data: existing } = await supabaseAdmin
    .from("customers")
    .select("id, full_name, phone")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) return { customer: existing, error: null };

  const { data: created, error } = await supabaseAdmin
    .from("customers")
    .insert({ full_name: fullName, phone })
    .select("id, full_name, phone")
    .single();

  if (error || !created) {
    return { customer: null, error: "صار خطأ أثناء حفظ بيانات العميل." };
  }

  return { customer: created, error: null };
}

export async function createReviewRequestAction(formData: {
  customerName: string;
  phone: string;
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

  if (!customerName || !formData.phone.trim() || !orderNumber || !productName) {
    return { success: false, message: "عبّي كل الحقول." };
  }

  const { customer, error: customerError } = await findOrCreateCustomer(
    customerName,
    formData.phone
  );
  if (!customer) {
    return { success: false, message: customerError ?? "صار خطأ." };
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      customer_id: customer.id,
      customer_name: customer.full_name,
      order_number: orderNumber,
      product_name: productName,
    })
    .select("token")
    .single();

  if (error || !data) {
    return { success: false, message: "صار خطأ أثناء إنشاء الطلب." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${customer.id}`);

  return {
    success: true,
    message: "تم إنشاء طلب التقييم.",
    link: `/review/${data.token}`,
  };
}

export async function createReviewRequestForCustomerAction(
  customerId: string,
  formData: { orderNumber: string; productName: string }
): Promise<CreateReviewRequestResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, message: "غير مصرح لك." };
  }

  const orderNumber = formData.orderNumber.trim();
  const productName = formData.productName.trim();

  if (!orderNumber || !productName) {
    return { success: false, message: "عبّي كل الحقول." };
  }

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id, full_name")
    .eq("id", customerId)
    .maybeSingle();

  if (!customer) {
    return { success: false, message: "العميل غير موجود." };
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      customer_id: customer.id,
      customer_name: customer.full_name,
      order_number: orderNumber,
      product_name: productName,
    })
    .select("token")
    .single();

  if (error || !data) {
    return { success: false, message: "صار خطأ أثناء إنشاء الطلب." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${customerId}`);

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
