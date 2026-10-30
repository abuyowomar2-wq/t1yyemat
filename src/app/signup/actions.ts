"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/slug";

export interface CompleteSignupResult {
  success: boolean;
  message: string;
}

// يُستدعى بعد ما signUp() بالمتصفح ينجح ويصير فيه session فعلية — نجيب
// هوية المستخدم من الجلسة نفسها (مو من قيمة يرسلها العميل) عشان محد
// يقدر يسوي ملف بائع لحساب غيره.
export async function completeSignupAction(formData: {
  slug: string;
  businessName: string;
}): Promise<CompleteSignupResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "لازم تسجّل دخول أول." };
  }

  const slug = formData.slug.trim().toLowerCase();
  const businessName = formData.businessName.trim();

  if (!businessName) {
    return { success: false, message: "اكتب اسم نشاطك." };
  }

  if (!isValidSlug(slug)) {
    return {
      success: false,
      message:
        "الرابط لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات بس، من 3 إلى 32 حرف، وما يبدأ أو ينتهي بشرطة.",
    };
  }

  const { data: existingForUser } = await supabaseAdmin
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingForUser) {
    return { success: true, message: "عندك حساب مسجّل مسبقًا." };
  }

  const { error } = await supabaseAdmin.from("merchants").insert({
    user_id: user.id,
    slug,
    business_name: businessName,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "هذا الرابط مستخدم من بائع آخر، جرّب رابط ثاني.",
      };
    }
    return { success: false, message: "صار خطأ أثناء إنشاء الحساب." };
  }

  return { success: true, message: "تم إنشاء حسابك." };
}
