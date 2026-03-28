export interface UserProfile {
  birthDate: string;
  heightCm: number;
  gender: 'M' | 'F';
}

export interface Workout {
  hr: number;
  mins: number;
  secs: number;
}

export interface Food {
  name: string;
  cals: number;
}

export interface DayData {
  weight: number;
  steps: number;
  workouts: Workout[];
  foods: Food[];
}

export interface Database {
  [date: string]: DayData;
}
