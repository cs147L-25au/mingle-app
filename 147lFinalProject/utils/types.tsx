// The following is consistent with the Supabase 'events' table:
export type Event = {
  id: string;
  name: string;
  activity_type: ActivityType;
  description: string;
  price_range: string;
  time_slot: string;
  event_date: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
};

export type ActivityType =
  | "Food & Dining"
  | "Hiking"
  | "Movies"
  | "Concerts"
  | "Sports"
  | "Gaming"
  | "Art & Museums"
  | "Coffee & Cafes"
  | "Home"
  | "Other";
