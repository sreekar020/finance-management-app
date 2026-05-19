# 📋 Software Requirements Specification (SRS) Document
## System: Tour Expense Manager

---

## 1. Introduction & Context

### 1.1 Document Purpose
This document provides the foundational context, functional workflows, and technical parameters of the Tour Expense Manager application. It defines both user-facing behavior and backend configurations to guide project presentation, code review, and future features.

### 1.2 Business Context & Problem Statement
Travel agencies, tour leaders, and field staff operate under highly dynamic conditions. Managing group tours involves handling:
1.  **Roster Complexity**: Keeping track of families, individual bookings, and companions (members) registered under a single primary customer.
2.  **Financial Dispersal**: Real-time payments logged on-field, varying per-head costs, and multi-currency/multi-account balances.
3.  **Field Expenditures**: Staff logging operational costs (fuel, local fees, meals) on-trip, which must be audited by central administrators to control profit margins.

Traditional paper logs, messaging groups, or standalone spreadsheets create operational delays and data discrepancies. **Tour Expense Manager** solves this by providing a real-time, offline-capable, cross-platform mobile interface linked to a secure Cloud Firestore backend with strict server-side permissions.

### 1.3 Scope of the System
The application is a **cross-platform mobile app** (compiled for Android and iOS using Expo SDK 54) powered by:
*   **Role-Based Access Control (RBAC)**: Segregated interfaces and capabilities for Admins and Staff.
*   **Real-time Synchronization**: Instant data pushes using Firestore listeners.
*   **Robust Deletion Cascades**: Atomic transaction operations (`writeBatch`) preventing data corruption.
*   **Server-enforced Integrity**: Database-level verification using Firestore security rules.

---

## 2. Functional & Non-Functional Requirements

### 2.1 Functional Requirements (FR)

| ID | Module | Description | Authorized Role |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Authentication** | Users must log in via Firebase Authentication with an email and password. | Admin, Staff |
| **FR-02** | **Session Setup** | The system must query Firestore to load the user's role profile (`admin` vs `staff`) and route the user to the appropriate navigation stack. | Admin, Staff |
| **FR-03** | **Tour Creation** | Admins can create new tour records containing a unique name and per-head price. | Admin |
| **FR-04** | **Tour Auditing** | Admins can edit tour settings and delete tours. Deletion must cascade-delete all children records. | Admin |
| **FR-05** | **Staff Scoped View** | Staff can only view tours, register new customers under them, and view their *own* registered expenses. | Staff |
| **FR-06** | **Customer Roster** | Users can onboard primary customers containing names, phone numbers, addresses, and email info. | Admin, Staff |
| **FR-07** | **Companion Registry** | Users can attach multiple traveling companions (members) with specific names, ages, and genders to a customer. | Admin, Staff |
| **FR-08** | **Payment Logging** | Users can register payment logs under a customer. The primary customer's `paidAmount` field must automatically reflect the aggregated total. | Admin, Staff |
| **FR-09** | **Expense Registration** | Admins can view/delete all logged expenses. Staff can create and edit their own expenses, but cannot view or manipulate expenses filed by other staff. | Admin, Staff |

### 2.2 Non-Functional Requirements (NFR)

1.  **Real-time Performance**: Data lists (Tours, Customers, Expenses) must synchronize within **$<1.5$ seconds** across devices via Firestore snapshots.
2.  **Type Safety**: The entire frontend codebase must be strictly typed in TypeScript to catch compile-time flaws and ensure stable refactoring.
3.  **Data Security**: Strict access restriction must be implemented at the database tier using Firestore Rules, rendering raw REST or API bypass attempts impossible.
4.  **Data Consistency**: Interconnected record deletions must execute as an atomic transaction (`writeBatch`) to prevent orphan child records (e.g. payments floating without customers).
5.  **Cross-Platform Portability**: Layouts must scale automatically using responsive styling, avoiding hardcoded widths, and run identically on both iOS and Android.

---

## 3. End-User Perspective (Operational Flows)

### 3.1 Authentication & Initialization Flow
When an end-user launches the application:
1.  They encounter a clean, gradient-themed Login Screen.
2.  Upon entering credentials and tapping **Login**, Firebase Auth verifies the account.
3.  A splash screen loading state is presented while the **AuthContext** fetches the user's profile from the `/users/{uid}` collection.
4.  If the user is an **Admin**, they are routed to the `AdminStack` navigation flow.
5.  If the user is **Staff**, they are routed to the `StaffStack` navigation flow, restricting access to administrative settings.

---

### 3.2 The Administrative Flow (Admin POV)

Admins oversee the entire business catalog. Their journey comprises four main pillars:
1.  **Tour Management**: 
    *   The Admin lands on a comprehensive tour listing. 
    *   They can tap the **"+"** icon to define a new tour (e.g. *Europe Tour 2026*, charging *\$1,200 per head*).
    *   If a tour package is canceled or discontinued, the Admin taps the **Delete** icon. The app prompts them with a verification dialog. Upon approval, all linked child files disappear in real-time.
2.  **Roster Audits**:
    *   Selecting a tour displays a list of primary customers registered for that journey.
    *   The Admin can add or edit customers, add accompanying travelers (e.g. children, spouses) into the **Members** list, and track payment milestones.
3.  **Financial Control Dashboard**:
    *   The Admin has a comprehensive view of trip expenditures.
    *   They can review every single expense uploaded by staff members in the field, inspect the user who logged it, check the description, and delete invalid charges.

---

### 3.3 The Field Agent Flow (Staff POV)

Staff agents focus on field operations, passenger check-ins, and recording on-trip costs:
1.  **Guided Client Onboarding**:
    *   On the tour bus or airport check-in, the agent views the designated tour file.
    *   They click **"Add Customer"** to register a client (e.g., name, phone number).
    *   They can immediately tap into the customer's profile to list group companions (e.g., *Jane Doe, Age 34, Female*), building a complete digital passenger manifest.
2.  **Field Ledger Entry**:
    *   When the client makes a payment (deposit, final payment), the staff member logs the exact amount. 
    *   The interface recalculates the total `paidAmount` instantly on the user screen.
3.  **Scoped Cost Filing**:
    *   If the agent pays for road tolls, driver lunch, or tickets, they tap **"Add Expense"** inside the Tour Detail Screen.
    *   They input the amount (e.g., *\$45*) and details (*"Driver Fuel Refill"*).
    *   The staff user sees a running ledger of **only the expenses they created**. They are completely blind to expenses filed by other agents or central admin files, protecting operational confidentiality.

---

## 4. Developer Perspective (Architectural Blueprint)

This section maps out how the codebase represents and secures the business workflows described above.

### 4.1 Data Modeling (TypeScript Interfaces)

The system enforces type safety through explicit interfaces found in `src/types/index.ts`. All Firestore snapshots are mapped against these schemas:

*   **Tours**: Holds destinations, pricing parameters, and passenger logs.
*   **Customers & Members**: Defines traveler databases linked to a parent Tour ID.
*   **Payments**: Independent ledger log linked to customer profiles.
*   **Expenses**: Account records containing cost details, destination IDs, and operator emails.

---

### 4.2 Security Layer Architecture (`firestore.rules`)

To achieve true enterprise-level security, role-based checks are enforced at the database driver tier. The `firestore.rules` file enforces database policies:

1.  **Administrative Role Determination**:
    Helper rules identify if a incoming write query is made by an Admin by verifying authentication parameters and querying `/users/{uid}` database values.
2.  **Cascading Scope Policies**:
    *   **Tours**: Accessible to read by any authenticated member. Strict write parameters allow **only** verified `admin` profiles to create, modify, or delete a tour block.
    *   **Expenses**: Staff can create records *only* if the record's `userId` matches their active auth token. Reads are strictly mapped so staff can never access expenses logged by others. Only admins possess global read, edit, and deletion privileges.

---

### 4.3 Transactional Stability: Cascading Deletions (`tourService.ts`)

A key engineering highlight of this app is its protection against orphaned nodes. In Firestore (a NoSQL database), relationships are logical. If an admin deletes a `Tour`, associated sub-collections would float in database space as unusable memory.

The `deleteTour` service resolves this by chaining database deletions in a single, safe **Firestore Batch** (`writeBatch`) operation. This atomic transaction rolls back completely if any single deletion step encounters network failure, ensuring zero datastore leakage.
