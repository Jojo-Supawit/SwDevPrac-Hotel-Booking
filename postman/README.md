# Hotel Booking API

Import `HotelBooking.postman_collection.json`, or open the local `Hotel Booking API` collection.

18 main requests, matching the course example:

- Authentication: Register, Login, Get Me, Logout.
- Hotels: list, get one, create, update, delete.
- Bookings: list, list for a hotel, get one, add, update, delete.
- Extra Credits: radius search, Cron trigger, PDF invoice.

Use **No environment**. In Collection Variables, set `URL`, `EMAIL`, `PASSWORD` and `ROLE` (`user` or `admin`). Register/Login saves `TOKEN`; creating a hotel or booking saves its ID automatically. `ROLE` applies to registration only: an existing account's permissions come from the server. Get All Hotels selects the first hotel when `HOTEL_ID` is empty; you can also set a chosen hotel ID manually.

## Runner, like VacQ

Right-click a folder, select **Run**, select all requests in that folder, and use **1 iteration**. Each folder controls its order with `pm.execution.setNextRequest()` and stops at the end. A failed HTTP response or `success: false` stops the workflow. These routing scripts do not change what happens when you press **Send** on a single request.

- **Authentication:** Register → Login → Get Me → Logout → stop. Use a new email for Register. For an existing account, deselect Register and start at Login. Logout clears `TOKEN`, so log in again before running a protected folder.
- **Hotels:** Get All Hotels → Create Hotel → Get Single Hotel → Update Hotel → Delete Hotel → stop. Login as **Admin** first. This workflow creates a new demo hotel and deletes that same hotel at the end; `HOTEL_ID` is then cleared.
- **Bookings:** Add Booking → Get Single Booking → Update Booking → Get All Bookings → Get Bookings for Hotel → Delete Booking → stop. Add Booking saves `response.data._id` to collection variable `BOOKING_ID`; Get Single, Update and Delete use `{{BOOKING_ID}}` automatically. A new run clears any previous ID before creating. Login as **User**, then run this folder. If `HOTEL_ID` is empty, Add Booking fetches the first existing hotel automatically before sending the booking request; a supplied `HOTEL_ID` is preserved. No booking ID needs to be pasted. Run again with an **Admin** account for that role. Each run creates and deletes its own demo booking; `BOOKING_ID` is then cleared.
- **Extra Credits:** select and run one request at a time. Each request stops immediately afterward. This avoids automatically chaining the global Cron job with unrelated requests.

Use **Keep variable values** when you need IDs or tokens to remain available after a run. Run folders individually, not the entire collection: the first completed workflow stops the run, just like the VacQ example. Keep all requests in the selected folder checked so its next-request links are available.

To demonstrate Admin access to a **User-owned** booking, create that booking as User first, then login as Admin and use the existing Get/Update/Delete Booking requests with its ID. The standalone Admin Bookings workflow creates an Admin-owned booking and does not by itself prove access to another user's records. The full presentation still needs its User/Admin and invalid-condition scenarios prepared.

For PDF, the booking must be `Completed`. With an Admin token, add `"status": "Completed"` to the existing Update Booking body, then send Download Invoice with the owner or Admin token.

Reuse Register with invalid data or Add Booking with `nights: 4` to inspect a 400 response; their success assertions will then fail and Runner stops. For a passing negative test, change the expected status and success assertion to match that scenario. `CHECK_IN_DATE` defaults to 10 days ahead only when empty, so you can provide a custom date for a Cron demo.

Trigger Cron Job requires Admin and processes **all** eligible bookings in the target database. Use test data. The backend's logout clears the cookie but does not revoke existing JWTs; the Logout request also clears the local `TOKEN` variable.
