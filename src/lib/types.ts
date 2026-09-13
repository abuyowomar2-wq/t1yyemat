export type ReviewStatus = "pending_review" | "submitted" | "approved" | "rejected";

export interface Review {
  id: string;
  token: string;
  customer_id: string | null;
  customer_name: string;
  order_number: string;
  product_name: string;
  rating: number | null;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  submitted_at: string | null;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
}

export interface ReviewByToken {
  customer_name: string;
  order_number: string;
  product_name: string;
  status: ReviewStatus;
}
