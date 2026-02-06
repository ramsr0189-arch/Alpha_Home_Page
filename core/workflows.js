// ═══════════════════════════════════════════════════════════════════════════
// ALPHAPROFIN - PRODUCT WORKFLOWS & DOCUMENT REQUIREMENTS
// Dynamic form generation based on product type
// ═══════════════════════════════════════════════════════════════════════════

const ProductWorkflows = {
    // Common sections reused across products
    common: {
        personal: [
            { q: "Full Name", type: "text", required: true },
            { q: "Date of Birth", type: "date", required: true },
            { q: "Gender", type: "dropdown", options: ["Male", "Female", "Other"], required: true },
            { q: "Father's Name", type: "text", required: true },
            { q: "Mother's Name", type: "text", required: true },
            { q: "Marital Status", type: "dropdown", options: ["Single", "Married", "Divorced", "Widowed"], required: true },
            { q: "Nationality", type: "dropdown", options: ["Indian", "NRI", "Foreign National"], required: true },
            { q: "PAN", type: "text", required: true },
            { q: "Aadhaar", type: "text", required: true },
            { q: "Email", type: "email", required: true },
            { q: "Alternate Mobile", type: "tel" },
            { q: "Alternate Email", type: "email" }
        ],
        address: [
            { q: "Current Address", type: "text", required: true },
            { q: "Landmark", type: "text" },
            { q: "City", type: "text", required: true },
            { q: "State", type: "dropdown", options: ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh"], required: true },
            { q: "Pincode", type: "text", required: true },
            { q: "Residence Type", type: "dropdown", options: ["Owned", "Rented", "Parental"], required: true },
            { q: "Years at Address", type: "number", required: true },
            { q: "Permanent Address Same as Current", type: "dropdown", options: ["Yes", "No"], required: true }
        ],
        bankDetails: [
            { q: "Bank Name", type: "dropdown", options: ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India", "Bank of India", "Indian Bank", "Central Bank of India", "IDBI Bank", "UCO Bank", "Indian Overseas Bank", "Yes Bank", "IDFC First Bank", "Federal Bank", "RBL Bank", "IndusInd Bank", "Other"], required: true },
            { q: "Account Number", type: "text", required: true },
            { q: "IFSC Code", type: "text", required: true },
            { q: "Account Type", type: "dropdown", options: ["Savings", "Current"], required: true },
            { q: "Account Vintage (Years)", type: "number" }
        ],
        familyDetails: [
            { q: "Number of Dependents", type: "number", required: true },
            { q: "Spouse Name", type: "text" },
            { q: "Spouse Employment Status", type: "dropdown", options: ["Not Applicable", "Employed", "Unemployed", "Self-employed"] },
            { q: "Spouse Monthly Income", type: "currency" }
        ],
        consent: [
            { q: "I authorize CIBIL/Credit Bureau score check", type: "checkbox", required: true },
            { q: "I accept Terms & Conditions", type: "checkbox", required: true },
            { q: "I consent to data sharing with lenders/partners", type: "checkbox", required: true },
            { q: "I agree to receive marketing communications", type: "checkbox" }
        ],
        references: [
            { q: "Reference 1 Name", type: "text" },
            { q: "Reference 1 Mobile", type: "tel" },
            { q: "Reference 2 Name", type: "text" },
            { q: "Reference 2 Mobile", type: "tel" }
        ]
    },

    // Product-specific workflows
    flows: {
        BL: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Business Profile 🏢": [
                { q: "Type of Business", type: "dropdown", options: ["Proprietorship", "Partnership", "Pvt Ltd", "LLP"], required: true },
                { q: "GST Number", type: "text" },
                { q: "CIN/LLPIN", type: "text" },
                { q: "Vintage (Years)", type: "number", required: true },
                { q: "Annual Turnover", type: "currency", required: true },
                { q: "Industry", type: "dropdown", options: ["Manufacturing", "Trading", "Services"], required: true },
                { q: "Number of Employees", type: "number" },
                { q: "Office Ownership", type: "dropdown", options: ["Owned", "Rented"] },
                { q: "Business Email", type: "email" },
                { q: "Business Phone", type: "tel" }
            ],
            "Financial Documents 📊": [
                { q: "ITRs (3 yrs)", type: "dropdown", options: ["Available", "Not Available"], required: true },
                { q: "GST Returns", type: "dropdown", options: ["Available", "Not Available"], required: true },
                { q: "Bank Statements (6M)", type: "dropdown", options: ["Available", "Not Available"], required: true },
                { q: "Audited Financials", type: "dropdown", options: ["Available", "Not Available"] }
            ],
            "Promoter Details 👤": [
                { q: "Promoter PAN", type: "text", required: true },
                { q: "Promoter Aadhaar", type: "text", required: true },
                { q: "CIBIL Score", type: "number", required: true },
                { q: "Existing Liabilities", type: "currency" }
            ],
            "Bank Details 🏦": "bankDetails",
            "Family Details 👨‍👩‍👧": "familyDetails",
            "References 🤝": "references",
            "Loan Requirement 💰": [
                { q: "Purpose", type: "dropdown", options: ["Working Capital", "Expansion", "Equipment", "Debt Consolidation"], required: true },
                { q: "Amount Requested", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ],
            "Consent & Authorization ✅": "consent"
        },
        PL: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Employment & Income 💼": [
                { q: "Employment Type", type: "dropdown", options: ["Salaried", "Self-employed"], required: true },
                { q: "Employer Name", type: "text", required: true },
                { q: "Company Type", type: "dropdown", options: ["MNC", "PSU", "Private Ltd", "Government", "Startup"] },
                { q: "Industry Sector", type: "dropdown", options: ["IT/Software", "BFSI", "Manufacturing", "Healthcare", "Education", "Retail", "Other"] },
                { q: "Designation", type: "text" },
                { q: "Job Vintage (Years)", type: "number", required: true },
                { q: "Total Work Experience (Years)", type: "number" },
                { q: "Monthly Net Salary", type: "currency", required: true },
                { q: "Salary Mode", type: "dropdown", options: ["Bank Transfer", "Cash", "Cheque"], required: true },
                { q: "Official Email ID", type: "email" },
                { q: "Office Address", type: "text" }
            ],
            "Financial Obligations 💳": [
                { q: "Existing Loans (EMI)", type: "currency" },
                { q: "Credit Card Limit", type: "currency" },
                { q: "CIBIL Score", type: "number", required: true }
            ],
            "Bank Details 🏦": "bankDetails",
            "Family Details 👨‍👩‍👧": "familyDetails",
            "References 🤝": "references",
            "Loan Requirement 🎁": [
                { q: "Amount Requested", type: "currency", required: true },
                { q: "Purpose", type: "dropdown", options: ["Personal", "Medical", "Education", "Travel", "Debt Consolidation"], required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ],
            "Consent & Authorization ✅": "consent"
        },
        PROF: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Professional Details 👨‍⚕️": [
                { q: "Profession", type: "dropdown", options: ["Doctor", "CA", "Architect", "Lawyer", "Engineer"], required: true },
                { q: "Qualification", type: "text", required: true },
                { q: "Registration Number", type: "text", required: true },
                { q: "Practice Vintage (Years)", type: "number", required: true }
            ],
            "Income & Practice 💼": [
                { q: "Practice Type", type: "dropdown", options: ["Individual", "Partnership", "Clinic/Firm"], required: true },
                { q: "Annual Income", type: "currency", required: true },
                { q: "Office Ownership", type: "dropdown", options: ["Owned", "Rented"], required: true }
            ],
            "Financial Documents 📊": [
                { q: "ITR (2 Years)", type: "dropdown", options: ["Available", "Not Available"], required: true },
                { q: "Bank Statements (6M)", type: "dropdown", options: ["Available", "Not Available"], required: true },
                { q: "Professional Registration", type: "dropdown", options: ["Available", "Not Available"], required: true }
            ],
            "References 🤝": "references",
            "Loan Requirement 💰": [
                { q: "Purpose", type: "dropdown", options: ["Equipment", "Practice Expansion", "Working Capital"], required: true },
                { q: "Amount Requested", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ]
        },
        HL: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Property Details 🏠": [
                { q: "Property Type", type: "dropdown", options: ["Ready to Move", "Under Construction", "Plot", "Resale"], required: true },
                { q: "Market Value", type: "currency", required: true },
                { q: "Location/City", type: "text", required: true },
                { q: "Builder Name", type: "text" },
                { q: "RERA Number", type: "text" },
                { q: "Possession Date", type: "date" }
            ],
            "Applicant Profile 👤": [
                { q: "Occupation", type: "dropdown", options: ["Salaried", "Self-employed", "Professional"], required: true },
                { q: "Total Experience (Years)", type: "number", required: true },
                { q: "Net Monthly Income", type: "currency", required: true },
                { q: "Existing EMIs", type: "currency" }
            ],
            "Bank Details 🏦": "bankDetails",
            "Family Details 👨‍👩‍👧": "familyDetails",
            "References 🤝": "references",
            "Loan Requirement 💰": [
                { q: "Loan Amount", type: "currency", required: true },
                { q: "Down Payment", type: "currency", required: true },
                { q: "Tenure (Years)", type: "number", required: true },
                { q: "Co-Applicant", type: "dropdown", options: ["Yes", "No"] }
            ],
            "Legal & Technical ⚖️": [
                { q: "Property Approved Plan", type: "dropdown", options: ["Yes", "No"], required: true },
                { q: "OC Received", type: "dropdown", options: ["Yes", "No", "NA"] },
                { q: "Title Clear Report", type: "dropdown", options: ["Done", "Pending"], required: true }
            ],
            "Consent & Authorization ✅": "consent"
        },
        LAP: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Property Valuation 🏦": [
                { q: "Property Type", type: "dropdown", options: ["Residential", "Commercial", "Industrial"], required: true },
                { q: "Market Value", type: "currency", required: true },
                { q: "Occupancy Status", type: "dropdown", options: ["Self Occupied", "Rented", "Vacant"], required: true },
                { q: "Property Age (Years)", type: "number", required: true }
            ],
            "Business/Income 💼": [
                { q: "Nature of Business", type: "text", required: true },
                { q: "3 Year Avg Profit", type: "currency", required: true },
                { q: "Annual Turnover", type: "currency", required: true },
                { q: "Banking Credits", type: "currency" }
            ],
            "Bank Details 🏦": "bankDetails",
            "Family Details 👨‍👩‍👧": "familyDetails",
            "References 🤝": "references",
            "Loan Requirement 💰": [
                { q: "Loan Amount", type: "currency", required: true },
                { q: "End Use", type: "text", required: true },
                { q: "Tenure (Months)", type: "number", required: true },
                { q: "LTV Requested (%)", type: "number" }
            ],
            "Existing Liabilities 📉": [
                { q: "Current EMIs", type: "currency" },
                { q: "CIBIL Score", type: "number", required: true },
                { q: "Bounces in Last 6M", type: "number" }
            ],
            "Consent & Authorization ✅": "consent"
        },
        CAR: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Vehicle Details 🚗": [
                { q: "Vehicle Type", type: "dropdown", options: ["New", "Used"], required: true },
                { q: "Make & Model", type: "text", required: true },
                { q: "On-Road Price", type: "currency", required: true },
                { q: "Manufacturing Year", type: "number" }
            ],
            "Employment & Income 💼": [
                { q: "Employment Type", type: "dropdown", options: ["Salaried", "Self-employed"], required: true },
                { q: "Monthly Income", type: "currency", required: true },
                { q: "Existing EMIs", type: "currency" }
            ],
            "Bank Details 🏦": "bankDetails",
            "Family Details 👨‍👩‍👧": "familyDetails",
            "Loan Requirement 💰": [
                { q: "Loan Amount", type: "currency", required: true },
                { q: "Down Payment", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ],
            "Consent & Authorization ✅": "consent"
        },
        "2W": {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Vehicle Details 🏍️": [
                { q: "Vehicle Type", type: "dropdown", options: ["New", "Used"], required: true },
                { q: "Make & Model", type: "text", required: true },
                { q: "On-Road Price", type: "currency", required: true }
            ],
            "Employment & Income 💼": [
                { q: "Employment Type", type: "dropdown", options: ["Salaried", "Self-employed"], required: true },
                { q: "Monthly Income", type: "currency", required: true }
            ],
            "Bank Details 🏦": "bankDetails",
            "Loan Requirement 💰": [
                { q: "Loan Amount", type: "currency", required: true },
                { q: "Down Payment", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ],
            "Consent & Authorization ✅": "consent"
        },
        MED: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Professional Details 👨‍⚕️": [
                { q: "Medical Qualification", type: "text", required: true },
                { q: "Registration Number", type: "text", required: true },
                { q: "Specialization", type: "text", required: true },
                { q: "Practice Vintage (Years)", type: "number", required: true }
            ],
            "Equipment Details 🏥": [
                { q: "Equipment Type", type: "text", required: true },
                { q: "Supplier Name", type: "text", required: true },
                { q: "Equipment Cost", type: "currency", required: true },
                { q: "Installation Required", type: "dropdown", options: ["Yes", "No"] }
            ],
            "Financial Documents 📊": [
                { q: "ITR (2 Years)", type: "dropdown", options: ["Available", "Not Available"], required: true },
                { q: "Bank Statements (6M)", type: "dropdown", options: ["Available", "Not Available"], required: true }
            ],
            "Loan Requirement 💰": [
                { q: "Loan Amount", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ]
        },
        MACH: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Business Profile 🏢": [
                { q: "Type of Business", type: "dropdown", options: ["Manufacturing", "Processing", "Services"], required: true },
                { q: "Business Vintage (Years)", type: "number", required: true },
                { q: "Annual Turnover", type: "currency", required: true }
            ],
            "Machinery Details ⚙️": [
                { q: "Machinery Type", type: "text", required: true },
                { q: "Supplier Name", type: "text", required: true },
                { q: "Machinery Cost", type: "currency", required: true },
                { q: "New/Used", type: "dropdown", options: ["New", "Used"], required: true }
            ],
            "Financial Documents 📊": [
                { q: "ITR (2 Years)", type: "dropdown", options: ["Available", "Not Available"], required: true },
                { q: "GST Returns", type: "dropdown", options: ["Available", "Not Available"], required: true }
            ],
            "Loan Requirement 💰": [
                { q: "Loan Amount", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ]
        },
        CV: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Vehicle Details 🚚": [
                { q: "Vehicle Type", type: "dropdown", options: ["Truck", "Tempo", "Mini Truck", "Trailer"], required: true },
                { q: "Make & Model", type: "text", required: true },
                { q: "Vehicle Cost", type: "currency", required: true },
                { q: "New/Used", type: "dropdown", options: ["New", "Used"], required: true }
            ],
            "Business Details 🏢": [
                { q: "Transport Business Vintage", type: "number", required: true },
                { q: "Existing Fleet Size", type: "number" },
                { q: "Monthly Revenue", type: "currency", required: true }
            ],
            "Loan Requirement 💰": [
                { q: "Loan Amount", type: "currency", required: true },
                { q: "Down Payment", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ]
        },
        CONST: {
            "Personal Profile 👤": "personal",
            "Address & Stability 🏠": "address",
            "Vehicle Details 🚜": [
                { q: "Vehicle Type", type: "dropdown", options: ["JCB", "Excavator", "Crane", "Bulldozer", "Loader"], required: true },
                { q: "Make & Model", type: "text", required: true },
                { q: "Vehicle Cost", type: "currency", required: true },
                { q: "New/Used", type: "dropdown", options: ["New", "Used"], required: true }
            ],
            "Business Details 🏗️": [
                { q: "Construction Business Vintage", type: "number", required: true },
                { q: "Existing Equipment", type: "number" },
                { q: "Monthly Revenue", type: "currency", required: true }
            ],
            "Loan Requirement 💰": [
                { q: "Loan Amount", type: "currency", required: true },
                { q: "Down Payment", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true }
            ]
        },
        SIP: {
            "Investor Profile 🧑‍💻": [
                { q: "Risk Appetite", type: "dropdown", options: ["Conservative", "Moderate", "Aggressive"], required: true },
                { q: "Investment Horizon", type: "dropdown", options: ["1-3 Years", "3-5 Years", "5+ Years"], required: true },
                { q: "Existing Portfolio Value", type: "currency" }
            ],
            "Wealth Goal 🎯": [
                { q: "Goal Name", type: "text", required: true },
                { q: "Target Amount", type: "currency", required: true },
                { q: "Years to Goal", type: "number", required: true }
            ],
            "Investment Details 💰": [
                { q: "Monthly SIP Amount", type: "currency", required: true },
                { q: "Preferred Fund Category", type: "dropdown", options: ["Equity", "Debt", "Hybrid", "Index"], required: true },
                { q: "Auto-Debit Date", type: "dropdown", options: ["1st", "5th", "10th", "15th", "20th", "25th"] }
            ],
            "KYC Check ✅": [
                { q: "PAN Card", type: "text", required: true },
                { q: "KYC Status", type: "dropdown", options: ["Registered", "Not Registered"], required: true },
                { q: "Nominee Name", type: "text" }
            ]
        },
        MF: {
            "Investor Profile 🧑‍💻": [
                { q: "Risk Appetite", type: "dropdown", options: ["Conservative", "Moderate", "Aggressive"], required: true },
                { q: "Investment Horizon", type: "dropdown", options: ["1-3 Years", "3-5 Years", "5+ Years"], required: true }
            ],
            "Investment Details 💰": [
                { q: "Investment Type", type: "dropdown", options: ["Lumpsum", "SIP"], required: true },
                { q: "Investment Amount", type: "currency", required: true },
                { q: "Preferred Fund", type: "dropdown", options: ["Equity", "Debt", "Hybrid", "ELSS"] }
            ],
            "KYC Check ✅": [
                { q: "PAN Card", type: "text", required: true },
                { q: "KYC Status", type: "dropdown", options: ["Registered", "Not Registered"], required: true }
            ]
        },
        PENSION: {
            "Personal Profile 👤": "personal",
            "Retirement Planning 👴": [
                { q: "Current Age", type: "number", required: true },
                { q: "Retirement Age", type: "number", required: true },
                { q: "Expected Monthly Pension", type: "currency", required: true }
            ],
            "Investment Details 💰": [
                { q: "Premium Mode", type: "dropdown", options: ["Monthly", "Quarterly", "Yearly"], required: true },
                { q: "Premium Amount", type: "currency", required: true },
                { q: "Annuity Option", type: "dropdown", options: ["Life", "Life with Spouse", "Guaranteed Period"] }
            ],
            "Nominee Details 👨‍👩‍👧": [
                { q: "Nominee Name", type: "text", required: true },
                { q: "Relationship", type: "text", required: true }
            ]
        },
        FD: {
            "Personal Profile 👤": "personal",
            "Deposit Details 💰": [
                { q: "Deposit Amount", type: "currency", required: true },
                { q: "Tenure (Months)", type: "number", required: true },
                { q: "Interest Payout", type: "dropdown", options: ["Monthly", "Quarterly", "Maturity"], required: true }
            ],
            "Nominee Details 👨‍👩‍👧": [
                { q: "Nominee Name", type: "text" },
                { q: "Relationship", type: "text" }
            ]
        },
        HEALTH: {
            "Proposer Details 🛡️": [
                { q: "Age", type: "number", required: true },
                { q: "Gender", type: "dropdown", options: ["Male", "Female"], required: true },
                { q: "Smoker/Tobacco", type: "dropdown", options: ["No", "Yes"], required: true },
                { q: "Occupation", type: "text", required: true }
            ],
            "Coverage Details 🏥": [
                { q: "Sum Insured", type: "currency", required: true },
                { q: "Family Floater", type: "dropdown", options: ["Individual", "2 Adults", "2A + 1C", "2A + 2C"], required: true },
                { q: "Room Type", type: "dropdown", options: ["Shared", "Single Private", "Deluxe"] }
            ],
            "Medical History 🩺": [
                { q: "Pre-existing Diseases", type: "dropdown", options: ["None", "Diabetes", "Hypertension", "Cardiac", "Other"] },
                { q: "Any Surgery in 3Y", type: "dropdown", options: ["No", "Yes"] }
            ],
            "Premium Details 💰": [
                { q: "Premium Mode", type: "dropdown", options: ["Annual", "Monthly"], required: true }
            ]
        },
        LIFE: {
            "Proposer Details 🛡️": [
                { q: "Age", type: "number", required: true },
                { q: "Gender", type: "dropdown", options: ["Male", "Female"], required: true },
                { q: "Smoker/Tobacco", type: "dropdown", options: ["No", "Yes"], required: true },
                { q: "Annual Income", type: "currency", required: true }
            ],
            "Coverage Details 💰": [
                { q: "Sum Assured", type: "currency", required: true },
                { q: "Policy Term (Years)", type: "number", required: true },
                { q: "Premium Paying Term", type: "number", required: true }
            ],
            "Nominee Details 👨‍👩‍👧": [
                { q: "Nominee Name", type: "text", required: true },
                { q: "Relationship", type: "text", required: true },
                { q: "Nominee Age", type: "number" }
            ]
        },
        TERM: {
            "Proposer Details 🛡️": [
                { q: "Age", type: "number", required: true },
                { q: "Gender", type: "dropdown", options: ["Male", "Female"], required: true },
                { q: "Smoker/Tobacco", type: "dropdown", options: ["No", "Yes"], required: true },
                { q: "Occupation Class", type: "dropdown", options: ["Low Risk", "Medium Risk", "High Risk"] }
            ],
            "Coverage Details 💰": [
                { q: "Sum Assured", type: "currency", required: true },
                { q: "Policy Term (Years)", type: "number", required: true },
                { q: "Riders Required", type: "dropdown", options: ["None", "Accidental Death", "Critical Illness", "Waiver of Premium"] }
            ],
            "Nominee Details 👨‍👩‍👧": [
                { q: "Nominee Name", type: "text", required: true },
                { q: "Relationship", type: "text", required: true }
            ]
        },
        TRAVEL: {
            "Traveler Details ✈️": [
                { q: "Number of Travelers", type: "number", required: true },
                { q: "Destination", type: "text", required: true },
                { q: "Travel Start Date", type: "date", required: true },
                { q: "Travel End Date", type: "date", required: true }
            ],
            "Coverage Details 🛡️": [
                { q: "Coverage Type", type: "dropdown", options: ["Individual", "Family"], required: true },
                { q: "Sum Insured", type: "currency", required: true },
                { q: "Medical Coverage", type: "dropdown", options: ["Basic", "Comprehensive"] }
            ]
        },
        VEHICLE_INS: {
            "Vehicle Details 🚗": [
                { q: "Vehicle Type", type: "dropdown", options: ["Car", "Two Wheeler"], required: true },
                { q: "Make & Model", type: "text", required: true },
                { q: "Registration Number", type: "text", required: true },
                { q: "Manufacturing Year", type: "number", required: true }
            ],
            "Insurance Details 🛡️": [
                { q: "Policy Type", type: "dropdown", options: ["Comprehensive", "Third Party"], required: true },
                { q: "IDV (Insured Declared Value)", type: "currency", required: true },
                { q: "Add-ons Required", type: "dropdown", options: ["None", "Zero Depreciation", "Engine Protection", "NCB Protection"] }
            ]
        },
        MACH_INS: {
            "Machinery Details ⚙️": [
                { q: "Machinery Type", type: "text", required: true },
                { q: "Make & Model", type: "text", required: true },
                { q: "Manufacturing Year", type: "number", required: true },
                { q: "Current Value", type: "currency", required: true }
            ],
            "Insurance Details 🛡️": [
                { q: "Coverage Type", type: "dropdown", options: ["Fire & Allied Perils", "Comprehensive"], required: true },
                { q: "Sum Insured", type: "currency", required: true }
            ]
        }
    },

    // Document requirements based on PRODUCT ID (Comprehensive 21-Product Matrix)
    documentMatrix: {
        // LOANS
        "BL": ["GST Registration Certificate", "Udyam Aadhar / Shop Act", "Latest 2 Years ITR + Computation", "Last 12 Months Bank Statement (Current)", "KYC of Proprietor/Partners/Directors", "Business Continuity Proof (3 Yrs)"],
        "PL": ["Last 3 Months Salary Slips", "Last 6 Months Bank Statement (Salary)", "Form 16 (Latest 2 Years)", "Company ID Card Copy", "KYC Documents (PAN + Aadhar)", "Current Address Proof"],
        "PROF": ["Professional Degree Certificate", "Certificate of Practice (CoP)", "Latest 2 Years ITR + Computation", "Last 6 Months Bank Statement", "KYC Documents", "Professional Registration Proof"],
        "HL": ["Sale Deed / Agreement to Sell", "Property Chain Documents (13/30 Yrs)", "Sanction Plan & Layout", "Occupancy Certificate (OC)", "Commencement Certificate (CC)", "KYC & Income Documents"],
        "LAP": ["Property Ownership Documents", "Latest Property Tax Receipt", "Sanction Plan & OC", "Latest 3 Years ITR with Audit Report", "Last 12 Months Bank Statement", "Business Registration Proof"],
        "CAR": ["Proforma Invoice / Quote", "KYC Documents (PAN + Aadhar)", "Income Proof (Salary Slips / ITR)", "Bank Statement (Last 6 Months)", "Signature Verification Proof"],
        "2W": ["Proforma Invoice / Quote", "KYC Documents (PAN + Aadhar)", "Income Proof (if Loan > ₹1 Lakh)", "Cheque Leaves (for ECS)"],
        "MED": ["Proforma Invoice of Equipment", "Medical Registration Certificate", "Professional Degree", "Last 6 Months Bank Statement", "KYC Documents", "Clinic/Hospital Address Proof"],
        "MACH": ["Proforma Invoice of Machinery", "GST Registration of Supplier", "Business Registration Proof", "Latest 2 Years ITR", "Last 6 Months Bank Statement", "KYC Documents"],
        "CV": ["Vehicle RCs of Existing Fleet", "Route Permit Copies", "Transportation Contract Copies", "Last 6 Months Bank Statement", "KYC of Owner/Operator"],
        "CONST": ["Work Orders in Hand", "GST Returns (Last 12 Months)", "Construction Equipment RCs", "Bank Statement (12 Months)", "KYC Documents"],

        // INVESTMENTS
        "SIP": ["PAN Card Copy", "Aadhar Card Copy", "Cancelled Cheque / Bank Proof", "Passport Size Photograph", "FATCA Declaration"],
        "MF": ["PAN Card Copy", "Aadhar Card Copy", "Cancelled Cheque", "FATCA Declaration", "KYC Acknowledgement"],
        "PENSION": ["Age Proof (School Cert / Passport)", "PAN Card Copy", "Aadhar Card Copy", "Proposal Form", "Cancelled Cheque (for Payout)"],
        "FD": ["PAN Card Copy", "Aadhar Card Copy", "Cheque for Deposit Amount", "Form 15G/15H (if applicable)"],

        // INSURANCE
        "HEALTH": ["KYC Documents (PAN + Aadhar)", "Medical Reports (if applicable)", "Previous Policy Copy (for Portability)", "Passport Size Photo", "Proposal Form"],
        "LIFE": ["Age Proof", "Identity Proof", "Address Proof", "Income Proof (ITR/Salary Slip) for High Cover", "Medical Examination Report"],
        "TERM": ["Mandatory Income Proof (ITR/Salary Slip)", "Age Proof", "Identity Proof", "Address Proof", "Medical Examination Report", "Passport Size Photo"],
        "TRAVEL": ["Passport Copy (First & Last Page)", "Valid Visa Copy", "Air Ticket Copy", "KYC Documents"],
        "VEHICLE_INS": ["RC Copy (Registration Certificate)", "Previous Policy Copy", "Vehicle Photos (if Break-in case)", "KYC Documents"],
        "MACH_INS": ["Invoice / Valuation Report", "Machine Serial Number Photo", "KYC Documents", "Previous Policy (if renewal)"]
    },

    // Get workflow for product
    getWorkflow(productId) {
        return this.flows[productId] || null;
    },

    // Get documents for PRODUCT
    getDocuments(productId) {
        // Fallback for logic where productId might be entityType (legacy support)
        return this.documentMatrix[productId] || this.documentMatrix["BL"];
    },

    // Expand common sections
    expandSection(sectionData) {
        if (typeof sectionData === 'string') {
            return this.common[sectionData] || [];
        }
        return sectionData;
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    window.ProductWorkflows = ProductWorkflows;
}
