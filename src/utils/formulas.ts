export const calculateAge = (birthDateStr: string): number => {
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age || 0;
};

export const calcBMR = (weight: number, height: number, age: number, gender: 'M'|'F') => {
  if (!weight) return 0;
  const offset = gender === 'M' ? 5 : -161;
  return (10 * weight) + (6.25 * height) - (5 * age) + offset;
};

export const calcNEAT = (weight: number, steps: number) => {
  if (!weight || !steps) return 0;
  return steps * 0.045 * (weight / 100);
};

export const calcEAT = (workouts: any[], weight: number, age: number) => {
  if (!weight) return 0;
  return workouts.reduce((total, wo) => {
    const totalMins = (wo.mins || 0) + ((wo.secs || 0) / 60);
    if (wo.hr > 80 && totalMins > 0) {
      const kcal = ((0.2017 * age + 0.09036 * weight + 0.6309 * wo.hr - 55.0969) * totalMins) / 4.184;
      return total + Math.max(0, kcal);
    }
    return total;
  }, 0);
};
