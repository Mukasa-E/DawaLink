# Software Requirements Specification (SRS)
## DawaLink - Digital Patient Referral and Medical Record Management System

Version 2.0  
Date: November 20, 2025

---

## 1. Introduction

### 1.1 Purpose
DawaLink is a web platform designed to digitize patient referral and medical record management for small healthcare facilities in Kenya. It allows healthcare providers (doctors, clinics, pharmacies, health centers) to securely transfer patient files between facilities, issue digital referral letters with QR codes, and give patients personal control of their medical records.

This SRS defines the functional and non-functional requirements of the DawaLink system and will serve as a reference for developers, testers, and stakeholders.

### 1.2 Document Conventions
- All functional requirements will be labeled as **FR-x**
- All non-functional requirements will be labeled as **NFR-x**
- All headings and feature names are in **bold** for clarity

### 1.3 Intended Audience and Reading Suggestions
This document is intended for:
- **Developers**: Focus on Sections 2–5
- **Testers**: Focus on Sections 3–5
- **Management**: Focus on Introduction and Overall Description sections
- **Healthcare Providers**: Focus on Section 4 (System Features)
- **Patients**: Focus on user features in Section 2.3

### 1.4 Product Scope
DawaLink will:
- **Digitize** patient referral and record management
- Allow healthcare providers to **securely transfer** patient files between facilities
- Give patients **personal control** of their medical records
- **Improve continuity of care** and reduce duplicate tests and costs
- Ensure **data privacy** with encryption and role-based access control
- Make healthcare records **affordable and scalable** for small facilities

### 1.5 References
- Kenyan Health Act and Data Protection Act
- Kenya Medical Practitioners and Dentists Board regulations
- Pharmacy and Poisons Board guidelines
- HIPAA alignment for privacy practices
- ISO 27001 for information security

---

## 2. Overall Description

### 2.1 Product Perspective
DawaLink is a new standalone web-based system designed to:
- Integrate with existing facility workflows
- Provide secure cloud-based storage for medical records
- Enable seamless referral transfers between facilities
- Support patient-centered data ownership

The system consists of:
- Web application for all user types
- RESTful API backend
- MongoDB database
- Secure authentication and authorization

### 2.2 Product Functions
1. **User Registration and Authentication**
   - Patient registration and login
   - Healthcare provider registration
   - Facility registration and verification
   
2. **Facility Management**
   - Register clinic, pharmacy, health center, diagnostic center
   - Manage facility information
   - Add/remove healthcare providers
   - Facility verification by admins

3. **Patient Medical Records**
   - Create consultation records
   - Store test results, diagnoses, prescriptions
   - Attach medical documents (scans, reports)
   - Record vital signs and lab results
   - Generate QR codes for shareable records

4. **Digital Referrals**
   - Issue referral letters with QR codes
   - Include clinical summary and vital signs
   - Set urgency levels (emergency, urgent, routine)
   - Track referral status
   - Transfer patient information securely

5. **Access Control**
   - Patient grants/revokes access to providers
   - Facility-level access management
   - Time-limited authorizations
   - Audit trail for all access

6. **Notifications**
   - Referral status updates
   - Access grant/revoke notifications
   - System notifications

7. **Admin Functions**
   - Facility verification
   - User management
   - System monitoring
   - Audit log review

### 2.3 User Classes and Characteristics

| User Class | Characteristics | Technical Skill |
|------------|----------------|-----------------|
| **Patients** | Access personal records; grant/revoke provider access; view referrals | Low to moderate |
| **Healthcare Providers** | Create records and referrals; view authorized patient data | Moderate |
| **Facility Admins** | Manage facility; oversee providers; facility-level reports | Moderate |
| **System Admins** | Platform administration; verify facilities; system monitoring | High |

### 2.4 Operating Environment
- **Platform**: Web-based (accessible via modern browsers)
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Server**: Cloud-based (Linux/Ubuntu), Node.js backend
- **Database**: MongoDB
- **Mobile**: Responsive design for smartphone access

### 2.5 Design and Implementation Constraints
1. Must comply with Kenyan healthcare and data protection regulations
2. Must use HTTPS/TLS for all communications
3. Backend API must be RESTful
4. Must support at least 100 concurrent users initially
5. All sensitive data must be encrypted at rest and in transit
6. Must maintain comprehensive audit logs
7. QR codes must expire after defined period (configurable)

### 2.6 User Documentation
- User manual (online PDF)
- In-app help section
- Video tutorials for facility registration
- Provider guide for creating referrals
- Patient guide for managing access

### 2.7 Assumptions and Dependencies
- Users have internet access
- Facilities provide accurate registration information
- Healthcare providers have valid licenses
- Patients have email or phone for verification
- Facilities maintain data accuracy and timeliness

---

## 3. External Interface Requirements

### 3.1 User Interfaces
- **Patient Portal**: Dashboard showing records, referrals, authorizations
- **Provider Interface**: Patient search, record creation, referral issuance
- **Facility Dashboard**: Statistics, provider management, referral tracking
- **Admin Panel**: Facility verification, user management, system monitoring
- **Standard Components**: Login, Register, QR Scanner, File Upload
- **Error Messages**: Clear and localized (English/Swahili)

### 3.2 Hardware Interfaces
- Smartphones with camera (for QR code scanning)
- Desktop/laptop computers
- Printers for referral letters and reports

### 3.3 Software Interfaces
- Integration with email services (SMTP)
- Integration with SMS gateway (optional - Africa's Talking)
- File storage for medical documents
- QR code generation libraries

### 3.4 Communications Interfaces
- **HTTPS** for secure communication
- **JSON over REST** APIs
- **Email** via SMTP
- **SMS** via gateway (optional)
- **WebSocket** for real-time notifications (future)

---

## 4. System Features

### 4.1 User Management

| Feature ID | Feature Name | Description |
|------------|-------------|-------------|
| **FR-1** | User Registration | Allow patients, providers, and facility admins to register |
| **FR-2** | User Login | Secure authentication with JWT tokens |
| **FR-3** | Role-Based Access | Different permissions for patient, provider, facility_admin, admin |
| **FR-4** | Password Recovery | Reset password via email |
| **FR-5** | Profile Management | Update user information |

### 4.2 Facility Management

| Feature ID | Feature Name | Description |
|------------|-------------|-------------|
| **FR-6** | Facility Registration | Register clinic, pharmacy, health center, etc. |
| **FR-7** | Facility Verification | Admin verifies facility with registration number |
| **FR-8** | Provider Management | Add/remove healthcare providers to facility |
| **FR-9** | Facility Search | Search facilities by type, location, services |
| **FR-10** | Facility Dashboard | View statistics and activity |

### 4.3 Medical Records

| Feature ID | Feature Name | Description |
|------------|-------------|-------------|
| **FR-11** | Create Record | Provider creates patient medical record |
| **FR-12** | View Records | Patients and authorized providers view records |
| **FR-13** | Update Record | Provider updates existing record |
| **FR-14** | Record Types | Support consultation, test results, prescriptions, diagnoses, etc. |
| **FR-15** | QR Code Generation | Generate QR codes for shareable records |
| **FR-16** | Attachments | Upload and store medical documents |
| **FR-17** | Vital Signs | Record blood pressure, temperature, pulse, etc. |
| **FR-18** | Lab Results | Store laboratory test results |

### 4.4 Digital Referrals

| Feature ID | Feature Name | Description |
|------------|-------------|-------------|
| **FR-19** | Create Referral | Provider issues digital referral letter |
| **FR-20** | QR Code Referral | Generate QR code for referral |
| **FR-21** | Clinical Summary | Include patient condition, diagnosis, treatment given |
| **FR-22** | Urgency Level | Set emergency, urgent, or routine urgency |
| **FR-23** | Referral Tracking | Track status (pending, accepted, in-progress, completed) |
| **FR-24** | Receive Referral | Receiving facility accepts and updates referral |
| **FR-25** | Referral History | View all referrals sent and received |
| **FR-26** | QR Verification | Verify referral authenticity via QR code |

### 4.5 Access Control

| Feature ID | Feature Name | Description |
|------------|-------------|-------------|
| **FR-27** | Grant Access | Patient grants provider/facility access to records |
| **FR-28** | Revoke Access | Patient revokes previously granted access |
| **FR-29** | View Authorizations | Patient views all active authorizations |
| **FR-30** | Access Levels | View-only or full access |
| **FR-31** | Time-Limited Access | Set expiration date for authorization |
| **FR-32** | Access Audit | Log all data access attempts |

### 4.6 Notifications

| Feature ID | Feature Name | Description |
|------------|-------------|-------------|
| **FR-33** | Referral Notifications | Notify on referral received, accepted, completed |
| **FR-34** | Access Notifications | Notify on access granted/revoked |
| **FR-35** | System Notifications | System messages and updates |
| **FR-36** | In-App Notifications | View notifications in application |

### 4.7 Admin Functions

| Feature ID | Feature Name | Description |
|------------|-------------|-------------|
| **FR-37** | Facility Verification | Approve registered facilities |
| **FR-38** | User Management | View and manage users |
| **FR-39** | Audit Logs | View comprehensive audit trail |
| **FR-40** | System Statistics | Dashboard with platform metrics |
| **FR-41** | Data Export | Export reports and analytics |

---

## 5. Other Nonfunctional Requirements

### 5.1 Security Requirements

| Req ID | Description |
|--------|-------------|
| **NFR-1** | All API calls must use HTTPS and token-based authentication (JWT) |
| **NFR-2** | Passwords must be hashed using bcrypt (min 10 rounds) |
| **NFR-3** | Sensitive data must be encrypted at rest |
| **NFR-4** | QR codes must include encryption/signing to prevent tampering |
| **NFR-5** | Session tokens must expire after 24 hours |
| **NFR-6** | Failed login attempts must be rate-limited |
| **NFR-7** | All data access must be logged in audit trail |

### 5.2 Performance Requirements

| Req ID | Description |
|--------|-------------|
| **NFR-8** | System must support 100 concurrent users minimum |
| **NFR-9** | API response time must be <3 seconds for 95% of requests |
| **NFR-10** | Database queries must be optimized with indexes |
| **NFR-11** | File uploads must support up to 10MB per file |
| **NFR-12** | QR code generation must complete in <1 second |

### 5.3 Usability Requirements

| Req ID | Description |
|--------|-------------|
| **NFR-13** | Interface must support English and Swahili languages |
| **NFR-14** | Mobile-responsive design for smartphone access |
| **NFR-15** | Forms must have clear validation messages |
| **NFR-16** | Critical actions must have confirmation dialogs |
| **NFR-17** | Help documentation accessible from all pages |

### 5.4 Auditability Requirements

| Req ID | Description |
|--------|-------------|
| **NFR-18** | All record access must be logged with user, timestamp, action |
| **NFR-19** | All referrals must be logged with complete trail |
| **NFR-20** | Authorization changes must be logged |
| **NFR-21** | Audit logs must be exportable for compliance |
| **NFR-22** | Logs must be retained for minimum 7 years |

### 5.5 Availability Requirements

| Req ID | Description |
|--------|-------------|
| **NFR-23** | System uptime must be at least 99% |
| **NFR-24** | Scheduled maintenance windows must be announced 48 hours in advance |
| **NFR-25** | System must have automated backups every 24 hours |
| **NFR-26** | Data recovery time objective (RTO) must be <4 hours |

### 5.6 Scalability Requirements

| Req ID | Description |
|--------|-------------|
| **NFR-27** | System must scale to support 1000+ facilities |
| **NFR-28** | Database must support 100,000+ patient records |
| **NFR-29** | Architecture must support horizontal scaling |

### 5.7 Compliance Requirements

| Req ID | Description |
|--------|-------------|
| **NFR-30** | Must comply with Kenya Data Protection Act |
| **NFR-31** | Must align with HIPAA privacy practices |
| **NFR-32** | Must support right to data deletion (GDPR-style) |
| **NFR-33** | Must maintain patient consent records |

---

## 6. Appendix

### Appendix A: Glossary

- **DawaLink**: The digital patient referral and medical record management platform
- **Facility**: A healthcare provider location (clinic, pharmacy, health center, hospital)
- **Provider**: A licensed healthcare professional (doctor, nurse, pharmacist)
- **Referral**: A formal transfer of patient care from one facility to another
- **QR Code**: Quick Response code containing encrypted referral/record data
- **Authorization**: Patient-granted permission for provider/facility to access records
- **Audit Log**: Comprehensive record of all system actions and data access
- **JWT**: JSON Web Token for secure authentication
- **RBAC**: Role-Based Access Control

### Appendix B: User Roles

1. **Patient**
   - Access personal medical records
   - View referrals
   - Grant/revoke provider access
   - Manage privacy settings

2. **Healthcare Provider**
   - Create medical records
   - Issue referrals
   - View authorized patient data
   - Update records within their facility

3. **Facility Admin**
   - Manage facility information
   - Add/remove providers
   - View facility statistics
   - Access facility-level reports

4. **System Admin**
   - Verify facilities
   - Manage all users
   - Access audit logs
   - System configuration

### Appendix C: Record Types

- **Consultation**: Doctor visit notes
- **Test Result**: Lab results, imaging reports
- **Prescription**: Medication prescriptions
- **Diagnosis**: Disease diagnosis records
- **Immunization**: Vaccination records
- **Surgery**: Surgical procedure notes
- **Follow-up**: Follow-up visit records
- **Other**: Miscellaneous medical records

### Appendix D: Facility Types

- **Clinic**: Small medical clinic
- **Pharmacy**: Retail pharmacy
- **Hospital**: Large hospital facility
- **Health Center**: Community health center
- **Diagnostic Center**: Lab and imaging center

### Appendix E: Urgency Levels

- **Emergency**: Life-threatening, immediate attention required
- **Urgent**: Serious condition, attention needed within 24 hours
- **Routine**: Normal referral, scheduled appointment

---

**Document Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Lead Developer | | | |
| QA Lead | | | |
| Stakeholder | | | |

---

**Revision History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Initial | DawaLink Team | Initial pharmacy marketplace version |
| 2.0 | Nov 20, 2025 | DawaLink Team | Complete refactor to patient referral system |
