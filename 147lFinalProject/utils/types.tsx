// TODO: add remaining fields, as this does not fully represent an Event entry
export type Event = {
  id: string;
  name: string;
  activity_type: ActivityType;
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
  | "Other";
