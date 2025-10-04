# Admin Dashboard (Next.js)

Giao diện quản trị cho hệ thống RewardCode và Wallet dựa trên API hiện có.

## Chức năng
- Đăng nhập admin (POST /api/auth/login)
- Tạo mã thưởng hàng loạt (POST /api/admin/reward-codes/bulk) và xem danh sách (GET /api/admin/reward-codes?redeemed=...)
- Nạp xu cho user theo User ID (GUID) (POST /api/admin/users/{id:guid}/credit)
- Thống kê mã thưởng đã dùng / chưa dùng (biểu đồ tròn)
- (Chờ API) Thống kê xu nạp theo user theo tháng

> Lưu ý: API hiện tại chưa có endpoint tìm user theo username. Tạm thời nhập User ID (GUID) để nạp xu.
> Khi bổ sung endpoint ví dụ GET /api/admin/users/find?username=xxx -> { id }, sửa hàm resolveUserId trong /admin/credit.

## Cấu hình
Tạo file `.env.local`:
```
NEXT_PUBLIC_API_BASE=http://localhost:5000
```

## Chạy dự án
```bash
npm install
npm run dev
# mở http://localhost:3000/login
```

## Ghi chú endpoint (đọc từ backend)
- POST /api/auth/login -> trả về { token }
- POST /api/admin/reward-codes/bulk với body:
  { "amount": 1000, "quantity": 20, "expiresAtUtc": "2025-12-31T23:59:59Z" }
  trả về Sample tối đa 50 mã.
- GET /api/admin/reward-codes?redeemed=true|false -> danh sách tối đa 500 bản ghi theo trạng thái
- POST /api/admin/users/{id:guid}/credit?amount=...&note=... -> cộng xu và ghi WalletTx (TxType.Credit)

## Đề xuất bổ sung API cho thống kê tháng
Thêm trong AdminController:
```csharp
[HttpGet("wallet/credits-monthly")]
public async Task<IActionResult> CreditsMonthly([FromQuery] int year) {
    var start = new DateTime(year, 1, 1);
    var end = start.AddYears(1);
    var q = _db.WalletTxs.AsNoTracking()
        .Where(t => t.Type == TxType.Credit && t.CreatedAtUtc >= start && t.CreatedAtUtc < end)
        .Join(_db.Users.AsNoTracking(), t => t.UserId, u => u.Id, (t,u) => new { t, u.UserName })
        .GroupBy(x => new { x.u.UserName, Month = x.t.CreatedAtUtc.ToString("yyyy-MM") })
        .Select(g => new { username = g.Key.UserName, month = g.Key.Month, total = g.Sum(x => x.t.Amount) })
        .OrderBy(x => x.username).ThenBy(x => x.month);
    return Ok(await q.ToListAsync());
}
```

Khi có API này, cập nhật trang `/admin/stats` để hiển thị bảng/biểu đồ.

## Thiết kế
- Next.js App Router + TypeScript
- UI nền tối, không phụ thuộc Tailwind
- Biểu đồ dùng recharts (npm i recharts)

## Bảo mật
- Lưu JWT của admin vào localStorage (admin_jwt)
- Mọi request gửi header Authorization: Bearer <token>
- Server kiểm tra Role = Admin (đã có [Authorize(Roles = nameof(UserRole.Admin))] trong AdminController)
