import AuthContext from '@/context/AuthContext';

describe('AuthContext defaults', () => {
  it('provides default values', () => {
    expect(AuthContext._currentValue.session).toBeNull();
    expect(AuthContext._currentValue.isOfficer).toBe(false);
  });
});
