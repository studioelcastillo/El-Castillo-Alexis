const normalizeUser = (user: any) => {
  if (!user || typeof user !== 'object') return user;

  const profile = user.profile || user.profiles || null;
  const profId = user.prof_id ?? profile?.prof_id ?? null;

  return {
    ...user,
    profile,
    prof_id: profId ?? user.prof_id,
  };
};

export const getStoredUser = () => {
  const raw = localStorage.getItem('dashboard_user') ?? localStorage.getItem('user');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return normalizeUser(parsed);
  } catch (error) {
    return null;
  }
};
