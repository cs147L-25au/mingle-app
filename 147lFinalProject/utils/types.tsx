// TODO: add time and date field
export type Event = {
  id: string;
  name: string;
  activity_type: ActivityType;
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
