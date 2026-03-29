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
    // 兼容旧数据，没有 type 字段的默认为有氧
    const type = wo.type || 'aerobic'; 
    
    // 1. 手动录入直接相加
    if (type === 'manual') {
      return total + Math.max(0, parseFloat(wo.kcal) || 0);
    }
    
    const totalMins = (parseFloat(wo.mins) || 0) + ((parseFloat(wo.secs) || 0) / 60);
    if (totalMins <= 0) return total;

    // 2. 有氧心率公式
    if (type === 'aerobic') {
      const hr = parseFloat(wo.hr) || 0;
      if (hr > 80) {
        const kcal = ((0.2017 * age + 0.09036 * weight + 0.6309 * hr - 55.0969) * totalMins) / 4.184;
        return total + Math.max(0, kcal);
      }
    } 
    // 3. 无氧 METs 算法 (Kcal = MET * 体重kg * 时间hr)
    else if (type === 'anaerobic') {
      // 强度对应 METs: 低=3.5(热身/恢复), 中=5.0(常规), 高=7.0(大重量复合动作)
      const met = wo.intensity === 'high' ? 7.0 : (wo.intensity === 'low' ? 3.5 : 5.0);
      const kcal = met * weight * (totalMins / 60);
      return total + Math.max(0, kcal);
    }
    
    return total;
  }, 0);
};
