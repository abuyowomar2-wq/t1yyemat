"use server";

import { supabasePublic } from "@/lib/supabase/client";

export interface SubmitReviewResult {
  success: boolean;
  message: string;
}

export async function submitReviewAction(
  token: string,
  rating: number,
  comment: string
): Promise<SubmitReviewResult> {
  if (!token) {
    return { success: false, message: "رابط غير صالح." };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, message: "اختر تقييمك من 1 إلى 5 نجوم." };
  }

  const trimmedComment = comment.trim().slice(0, 2000);

  const { data, error } = await supabasePublic.rpc("submit_review", {
    p_token: token,
    p_rating: rating,
    p_comment: trimmedComment.length > 0 ? trimmedComment : null,
  });

  if (error) {
    return { success: false, message: "صار خطأ غير متوقع، حاول مرة ثانية." };
  }

  if (!data) {
    return {
      success: false,
      message: "هذا الرابط مستخدم من قبل أو غير صالح.",
    };
  }

  return { success: true, message: "شكرًا لك! تم إرسال تقييمك بنجاح." };
}
