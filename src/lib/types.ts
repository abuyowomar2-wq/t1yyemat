export type ReviewStatus = "pending_review" | "submitted" | "approved" | "rejected";

export interface Review {
  id: string;
  token: string;
  customer_name: string;
  order_number: string;
  product_name: string;
  rating: number | null;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  submitted_at: string | null;
}

export interface ReviewByToken {
  customer_name: string;
  order_number: string;
  product_name: string;
  status: ReviewStatus;
}
