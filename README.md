PROJECT NODEJS
--
Demo url: https://youtu.be/n_Z_4SnPwqc?si=Yooz564Cp825O5pC
--
PROJECT sử dụng MongoDb để lưu trữ dữ liệu
--
## Cấu trúc đồ án:

 ## ĐỒ ÁN ĐƯỢC XÂY DỰNG CHIA MODULE MỘT CÁCH HỢP LÝ THEO MÔ HÌNH MVC:

    Trong đó gồm:
	
	* thư mục config: chứa các cấu hình của dự án (cấu hình dtb, .env, ...)

	* thư mục controllers: chứa các middleware đảm nhiệm vai trò xử lý logic, dữ liệu đưa đến front end.

	* thư mục services: chứa các service giao tiếp với database để truy xuất dữ liệu.

	* thư mục views: chứa giao diện của dự án.

	* thư mục models: chứa các model của dự án.

	* thư mục public: chứa các tài liệu tĩnh của dự án (css, js, hình ảnh, ...).

 	* thư mục route: chứa các endpoint mà người dùng có thể truy cập.

	* file app.js: file chính của hệ thống dùng để cấu hình và khởi chạy dự án với file này.

	* Ngoài ra còn một số file khác như: package.json, utils, ...

## CHẠY ĐỒ ÁN

+ Tài khoản quản trị viên: admin/admin

+ Tài khoản nhân viên: user/user

- Các tính năng trong trang web:

- Quản lí tài khoản: 
	+ Admin có sẵn tài khoản (admin/ admin) nhưng vẫn thay đổi mật khẩu được.
	+ User được cấp tài khoản do admin tạo (Họ tên, gmail). Admin gửi link qua mail (1 phút. Sau 1ph user phải yêu cầu để gửi lại link 1 phút khác). Bắt buộc sử dụng link khi đăng nhập lần đầu, báo lỗi "Vui lòng đăng nhập bằng cách nhấp vào liên kết trong email của bạn".
	+ Username, password: là phần trước @ mail của mình (quynhxinh@gmail.com => username:quynhxinh, password: quynhxinh). Và sau khi đăng nhập vào lần đầu bắt buộc phải tạo mật khẩu mới, nếu không đổi mk thì không làm được gì ngoài đăng xuất.
	+ User, admin quản lí profile (ảnh, họ tên). Đổi ảnh, đổi mk.
	+ Admin quản lí profile user (avt, họ tên,... trạng thái tài khoản (không kích hoạt, khóa) và thông tin chi tiết. Gửi email đăng nhập user 1ph, khóa. mở tk, xem thông tin bán hàng của user.

- Quản lí danh mục sản phẩm (Admin)
	+ Quản lí sp: xem danh sách, thêm, xóa, sửa sản phẩm,.. Sản phẩm (mã vạch, tên, giá nhập, giá bán, chủng loại, ngày tạo)
	+ User được xem danh sách sp nhưng k được thay đổi và k nhìn thấy giá gốc

- Quản lí khách hàng
	+ Khách cũ: sdt -> tên, địa chỉ, Khách mới: sdt -> form nhập tên, địa chỉ (thanh toán xong mới tạo tài khoản).
	+ User xem thông tin khách hàng (tên, sdt, địa chỉ, lịch sử mua hàng (tổng tiền, số tiền đã đưa, hoàn trả, ngày mua, sản phẩm, số lượng,... chia tiết đơn hàng (danh sách sản phẩm, giá bán))

- Xử lí giao dịch
	+ User thanh toán bằng mã vạch hoặc tìm kiếm (số trên mã vạch, mã sản phẩm,..).

- Báo cáo:
	+ Bán hàng (số tiền, sl đơn hàng, số lượng sản phẩm theo thời gian): hôm nay, qua, 7 ngày, 1 tháng và 1 khoảng thời gian
	+ Admin có thêm phần lợi nhuận (số tiền - giá nhập)

-----------------------------------------
Admin
- Profile/ Đổi mk
- Trang gửi link mail cho nhân viên xác nhận
- Trang quản lí tài khoản nhân viên (avt, họ tên, trạng thái)
- Trang quản lí sản phẩm (xem thêm xóa sửa sp => mã vạch tên giá nhập giá bán chung loại ngày tạo). 
- Báo cáo (tổng tiền, số lượng đơn, số lượng sản phẩm) => filter ngày, tuần, tháng, khoảng thời gian
User
- Profile/ Đổi mk
- Trang đổi mk lần đầu
- Trang quản lí sản phẩm ( - giá nhập)
- Báo cáo (-lợi nhuận)
- Trang giao dịch (thêm sản sản phẩm bằng qr, tên)
- Trang thông tin khách hàng nhập bằng sdt (cũ => thông tin, mới => form thêm sdt, địa chỉ)
- Trang tổng quan (sản phẩm mua (mã sp, tổng số tiền, số tiền khách đưa, thông tin người dùng) => bill (tên sp, số lượng, tổng tiền, tiền đưa, tiền thừa, thời gian mua, tên nhân viên, tên khách hàng).
