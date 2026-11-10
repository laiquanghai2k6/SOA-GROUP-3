# Giai Doan 5 Phan Chia Module

## Muc tieu

Giai doan 5 chi phan cong pham vi M1–M9 cho cac teammate theo SRS. Chua trien khai code, chua tao endpoint, chua sua schema database va chua viet test.

M0 Platform tiep tuc do teammate phu trach nen tang hien tai quan ly; cac teammate M1–M9 chi phoi hop theo cac hop dong duoi day.

## Phan cong chinh

| Teammate   | Module         | Pham vi SRS                                            | Pham vi phu trach                                                                                              | Uu tien     |
| ---------- | -------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------- |
| Teammate 1 | M1 Auth        | AUTH-01–AUTH-09; endpoint `/auth/*`                    | Dang ky, dang nhap, cookie access/refresh token, refresh rotation, dang xuat, doi mat khau, RBAC va auth guard | MUST        |
| Teammate 2 | M2 Users       | USR-01–USR-08; endpoint `/users/*`                     | Ho so ca nhan, cap nhat thong tin, dia chi giao hang, quan tri user, kiem tra ownership                        | MUST        |
| Teammate 3 | M3 Catalog     | CAT-01–CAT-11; endpoint `/categories/*`, `/products/*` | Danh muc, san pham, anh, slug, tim kiem/loc/sap xep, ton kho va inventory movements                            | MUST        |
| Teammate 4 | M4 Cart        | CART-01–CART-07; endpoint `/cart`                      | Gio hang cua customer, them/sua/xoa item, gioi han so luong/dong, tinh subtotal va trang thai available        | MUST        |
| Teammate 5 | M5 Coupons     | CPN-01–CPN-08; endpoint `/coupons/*`                   | Quan ly coupon, validate coupon, tinh discount, usage limit, redeem/release va idempotency lien quan           | MUST        |
| Teammate 6 | M6 Orders      | ORD-01–ORD-16; endpoint `/orders/*`                    | Checkout transaction, snapshot gia/dia chi, vong doi don hang, lich su trang thai, cancel va idempotency       | MUST        |
| Teammate 7 | M7 Payments    | PAY-01–PAY-08; endpoint payment/webhook                | Mock payment, COD, webhook HMAC, event idempotency, payment status va refund mock                              | MUST/SHOULD |
| Teammate 8 | M8 Reviews     | REV-01–REV-06; endpoint `/products/{id}/reviews`       | Danh sach review, tao review theo dieu kien da mua, uniqueness moi user/san pham, cap nhat rating aggregate    | MUST        |
| Teammate 9 | M9 Admin Stats | STAT-01–STAT-04; endpoint `/admin/stats/*`             | Bao cao overview, don theo trang thai, user moi, top selling va low-stock                                      | COULD       |

## Cau truc folder ban giao

Moi folder duoi day da duoc tao san voi mot file module rong. Teammate tu trien khai noi dung trong pham vi cua minh; khong import vao `AppModule` trong Giai doan 5.

| Teammate   | Folder                    | File rong ban giao      |
| ---------- | ------------------------- | ----------------------- |
| Teammate 1 | `src/modules/auth`        | `auth.module.ts`        |
| Teammate 2 | `src/modules/users`       | `users.module.ts`       |
| Teammate 3 | `src/modules/catalog`     | `catalog.module.ts`     |
| Teammate 4 | `src/modules/cart`        | `cart.module.ts`        |
| Teammate 5 | `src/modules/coupons`     | `coupons.module.ts`     |
| Teammate 6 | `src/modules/orders`      | `orders.module.ts`      |
| Teammate 7 | `src/modules/payments`    | `payments.module.ts`    |
| Teammate 8 | `src/modules/reviews`     | `reviews.module.ts`     |
| Teammate 9 | `src/modules/admin-stats` | `admin-stats.module.ts` |

## Thu tu phoi hop

| Nhom                   | Module  | Can thong nhat truoc                                                                                | Module phu thuoc           |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------------- | -------------------------- |
| Nen tang auth          | M1      | Cookie contract, UserOut, role/status, auth guard va ownership rule                                 | M2, M4, M5, M6, M7, M8, M9 |
| Du lieu hang hoa       | M3      | PublicId, product/category output, stock contract, inventory movement contract                      | M4, M6, M8, M9             |
| Gio hang va khuyen mai | M4 + M5 | Transaction interface cho checkout, item snapshot input, discount result va redeem/release contract | M6                         |
| Don hang va thanh toan | M6 + M7 | Order status transition, payment event `payment.succeeded`, payment ownership                       | M8, M9                     |
| Bao cao                | M9      | Read-only query contract voi Orders, Payments, Catalog, Users                                       | Khong block module MUST    |

## Hop dong lien module can chot

| Ben goi  | Ben duoc goi | Hop dong can ghi ro                                                                         |
| -------- | ------------ | ------------------------------------------------------------------------------------------- |
| Orders   | Users        | `getAddressForUser(userId, addressId)`                                                      |
| Orders   | Cart         | `getCartForCheckout(tx, userId)`, `clearCart(tx, cartId)`                                   |
| Orders   | Catalog      | `getProductsForCheckout(tx, ids)`, `decrementStock(tx, items)`, `restoreStock(tx, items)`   |
| Orders   | Coupons      | `validateAndCompute(tx, code, userId, subtotal)`, `redeem(tx, ...)`, `release(tx, orderId)` |
| Orders   | Payments     | `createForOrder(tx, order)` cho COD                                                         |
| Payments | Orders       | Khong goi truc tiep; phat su kien `payment.succeeded`                                       |
| Reviews  | Orders       | `hasDeliveredOrderWithProduct(userId, productId)`                                           |
| Reviews  | Catalog      | `updateRatingAggregate(tx, productId)`                                                      |

## Nguyen tac ban giao

1. Moi teammate chi so huu module duoc phan cong; khong sua logic module khac neu chua thong nhat hop dong.
2. Moi module phai ghi ro public API, input/output DTO, loi chuan, authorization va cac endpoint du kien truoc khi bat dau code.
3. M1, M3 va M6 la cac diem can review chung vi anh huong nhieu module.
4. M9 la module COULD, chi bat dau sau khi cac module MUST da chot hop dong du lieu.
5. Mọi module ap dung quy uoc chung trong SRS: public_id, problem+json, pagination, idempotency, ownership va khong lo `password_hash`/`token_hash`.

## Ket qua cua Giai doan 5

- Da co owner ro rang cho M1–M9.
- Da xac dinh pham vi SRS va endpoint cua tung owner.
- Da xac dinh thu tu phoi hop va hop dong lien module.
- Chua co thay doi implementation nao trong giai doan nay.
