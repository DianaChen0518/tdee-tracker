export interface UserProfile {
  birthDate: string;
  heightCm: number;
  gender: 'M' | 'F';
}

export interface Workout {
  type?: 'aerobic' | 'anaerobic' | 'manual'; // 兼容旧数据，可选
  hr?: number;
  mins?: number;
  secs?: number;
  intensity?: 'low' | 'med' | 'high'; // 无氧强度
  kcal?: number; // 手动输入的热量
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
