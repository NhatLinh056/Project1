// Helper to logout everywhere
export const doLogout = (navigate) => {
  console.log('🔴 doLogout called');
  
  try {
    // Xóa tất cả dữ liệu liên quan đến user
    console.log('🔴 Removing user_info and token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('token');
    
    // Dispatch event để các component biết user đã logout
    window.dispatchEvent(new Event('user-update'));
    console.log('🔴 Dispatched user-update event');
  } catch (e) {
    console.error('❌ Error during logout:', e);
  }
  
  // Force reload toàn bộ trang để đảm bảo xóa hết state và redirect về login
  console.log('🔴 Redirecting to /login');
  
  // Thử navigate trước (nếu có)
  if (navigate) {
    try {
      console.log('🔴 Trying navigate first');
      navigate('/login', { replace: true });
      // Đợi một chút rồi force reload
      setTimeout(() => {
        console.log('🔴 Force reload after navigate');
        window.location.href = '/login';
      }, 100);
      return;
    } catch (e) {
      console.error('❌ Navigate failed:', e);
    }
  }
  
  // Fallback: Dùng window.location.href để force reload hoàn toàn
  console.log('🔴 Using window.location.href');
  window.location.href = '/login';
};

